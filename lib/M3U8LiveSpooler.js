(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("M3U8LiveSpooler", function moduleClosure(global, WebModule, VERIFY, VERBOSE) {
"use strict";

// --- technical terms / data structure --------------------
/*
ChunkObject: Object
    - stream:       ObjectArray - [{ index, url, duration }, ...]
        - index:        UINT32
        - url:          URLString
        - duration:     UINT32
    - indexes:      UIN32Array - [index, ...]
    - duration:     UINT32 - estimated durarion from M3U8 index playlist
    - buffer:       ArrayBufferArray
 */
// --- dependency modules ----------------------------------
var M3U8            = WebModule["M3U8"];
var FileLoader      = WebModule["FileLoader"];
// --- import / local extract functions --------------------
// --- define / local variables ----------------------------
var STATE_NEW       = 0;
var STATE_CACHED    = 1;
var STATE_USED      = 2;
var STATE_RELEASED  = 3;
var STATE_ERROR     = 4;
// --- class / interfaces ----------------------------------
function M3U8LiveSpooler(url,             // @arg URLString
                         eventCallback) { // @arg Function - eventCallback(event:Object):void
    this._src           = url; // IndexPlaylistObject
    this._eventCallback = eventCallback; // { type: "error", detail: { url, code } } or { type: "timeout", detail: { url, code } }
    this._fetchfn       = _fetch.bind(this);
    this._fetchTimerID  = 0; // fetch timer id. (setTimeout timer)
    this._fetchInterval = 10;
    this._bufferMap     = {}; // { index: Blob, ... }
    this._indexMap      = {}; // { index: { index, url, state, duration, startTime, endTime, created_at, updated_at }, ... }
    this._cachedDuration = 0;
    this._lastM3U8String = ""; // diff check
    this._stopped       = true;
    this._live          = true;
    this._movieDuration = 0; // every zero in live
    this._seekHeadIndex = 0; // every zero in live
}

M3U8LiveSpooler["VERBOSE"] = VERBOSE;
M3U8LiveSpooler["prototype"] = Object.create(M3U8LiveSpooler, {
    "constructor":  { "value": M3U8LiveSpooler         }, // new M3U8LiveSpooler(...):M3U8LiveSpooler
    "has":          { "value": M3U8LiveSpooler_has     }, // M3U8LiveSpooler#has(ms:UINT32):Boolean
    "use":          { "value": M3U8LiveSpooler_use     }, // M3U8LiveSpooler#use(ms:UINT32):ChunkObject|null
    "seek":         { "value": M3U8LiveSpooler_seek    }, // M3U8LiveSpooler#seek(seekTime:UINT32):Object|null - { index, startTime, endTime }
    "start":        { "value": M3U8LiveSpooler_start   }, // M3U8LiveSpooler#start():void
    "stop":         { "value": M3U8LiveSpooler_stop    }, // M3U8LiveSpooler#stop():void
    "clear":        { "value": M3U8LiveSpooler_clear   }, // M3U8LiveSpooler#clear():void
    "release":      { "value": M3U8LiveSpooler_release }, // M3U8LiveSpooler#release(indexes:UINT32Array):void
    "cachedDuration": { "get": function() { return this._cachedDuration; } },
    "movieDuration":  { "get": function() { return this._movieDuration;  } },
});

// --- implements ------------------------------------------
function M3U8LiveSpooler_start() {
    this["stop"]();
    this._stopped = false;
    this._fetchfn();
}

function M3U8LiveSpooler_stop() {
    if (this._fetchTimerID) {
        clearTimeout(this._fetchTimerID);
        this._fetchTimerID = 0;
    }
    this._stopped = true;
}

function _fetch() {
    var that = this;

    if (this._src) {
        if (!this._live) {
            if (this._movieDuration) { // M3U8 fetched?
                if (this._stopped) { return; }
                this._fetchTimerID = setTimeout(this._fetchfn, this._fetchInterval); // fetch timer restart.
                _cache(this);
                return;
            }
        }

        M3U8["load"](this._src, function(m3u8, url) {
            if (that._stopped) { return; }
            that._fetchTimerID = setTimeout(that._fetchfn, that._fetchInterval); // fetch timer restart.

            if (that._lastM3U8String !== m3u8) { // modified?
                that._lastM3U8String = m3u8;

                var playlist = M3U8["parse"](m3u8, url); // IndexPlaylistObject

                if (playlist) {
                    if (M3U8LiveSpooler["VERBOSE"]) {
                        _dumpStream(playlist);
                    }

                    that._fetchInterval = (playlist["targetDuration"] <= 3000) ? 400 : 1000;
                    that._movieDuration = playlist["duration"];

                    _merge(that, playlist["stream"]);
                    if (that._live) { // immediate cache
                        _cache(that);
                    }
                }
            } else if (!that._live) {
                _cache(that);
            }
        }, function(error, url, code) {
            console.error(error.message, url, code);
            if (that._eventCallback) {
                that._eventCallback({ "type": "error", "detail": { "url": url, "code": code } });
            } else {
                console.error("M3U8LiveSpooler connection lost");
            }
        }, { "timeout": 5000 });
    }
}

function M3U8LiveSpooler_has(ms) { // @arg UINT32 - milliseconds
    var duration = 0;

    for (var indexString in this._indexMap) {
        var index = parseInt(indexString, 10);

        if (index >= this._seekHeadIndex) {
            var obj = this._indexMap[index];

            if (obj["state"] === STATE_CACHED) {
                duration += obj["duration"];
                if (duration >= ms) {
                    return true;
                }
            }
        }
    }
    return false;
}

function M3U8LiveSpooler_use(ms) { // @arg UINT32 - milliseconds
                                   // @ret ChunkObject|null - { stream:ObjectArray, indexes:UIN32Array, duration:UINT32, buffer:ArrayBufferArray }
    var indexes = [];
    var duration = 0;
    var result = {
        "stream":   [],
        "indexes":  [], // UINT32 - [index, ...]
        "duration": 0,
        "buffer":   [], // ArrayBufferArray
    };

    for (var indexString in this._indexMap) {
        var index = parseInt(indexString, 10);

        if (index >= this._seekHeadIndex) {
            var obj = this._indexMap[index];

            if (obj["state"] === STATE_CACHED) {
                obj["state"] = STATE_USED;
                obj["updated_at"] = Date.now();

                duration += obj["duration"];
                indexes.push( parseInt(index, 10) );

                result["buffer"].push(this._bufferMap[index]);
                result["stream"].push(obj);

                if (duration >= ms) {
                    result["indexes"]  = indexes;
                    result["duration"] = duration;

                    if (M3U8LiveSpooler["VERBOSE"]) {
                        console.info("USE", {
                            "indexes":  indexes.join(","),
                            "duration": this._cachedDuration + " - " + duration + " -> " + (this._cachedDuration - duration),
                        });
                    }

                    // reduce cache
                    this._cachedDuration -= duration;
                    return result;
                }
            }
        }
    }
    return result;
}

function M3U8LiveSpooler_seek(/* seekTime */) { // @arg UINT32
                                                // @ret Object|null - { index:Number, startTime:UINT32, endTime:UINT32 }
/* Live は seek 不能
    if (!this._live) {
        for (var indexString in this._indexMap) {
            var index     = parseInt(indexString, 10);
            var ts        = this._indexMap[index]; // { index, url, duration, startTime, endTime }
            var startTime = ts["startTime"];
            var endTime   = ts["endTime"];

            if (seekTime >= startTime && seekTime <= endTime) {
                this._seekHeadIndex = index;
                _reload(this);
                return {
                    "index":     index,
                    "startTime": startTime,
                    "endTime":   endTime,
                };
            }
        }
    }
 */
    return null;
}

/* Live は seek 不能
function _reload(that) {
    var now = Date.now();

    for (var indexString in that._indexMap) {
        var index = parseInt(indexString, 10);
        var obj = that._indexMap[index];

        if (index >= that._seekHeadIndex) {
            // 更新対象をSTATE_RELEASEDに限定した状態で激しく前後にSeekすると、
            // 状態の断片化が発生し、上手く行かなくなるため、seekHeadIndex以降を全てNEWにしている
            switch (obj["state"]) {
            case STATE_NEW:
            case STATE_CACHED:
            case STATE_USED:
            case STATE_RELEASED:
            case STATE_ERROR:
                that._bufferMap[index] = null;
                obj["updated_at"] = now;
                obj["state"] = STATE_NEW;
            }
        }
    }
    _cache(that);
}
 */

function M3U8LiveSpooler_release(indexes) { // @arg UINT32Array - [index, ...]
    for (var i = 0, iz = indexes.length; i < iz; ++i) {
        var index = indexes[i];

        if (this._indexMap[index]["state"] === STATE_NEW) { // seek直後の状態
            // この場合は例外として状態を更新しない
        } else {
            this._indexMap[index]["state"] = STATE_RELEASED;
            this._indexMap[index]["updated_at"] = Date.now();
            this._bufferMap[index] = null;
        }
    }
}

function M3U8LiveSpooler_clear() {
    this._src           = "";
    this._stopped       = true;
    this._bufferMap     = {};
    this._indexMap      = {};
    this._cachedDuration = 0;
    this._seekHeadIndex = 0;
}

function _merge(that, stream) { // @arg IndexPlaylistStreamObjectArray
    var now = Date.now();

    for (var i = 0, iz = stream.length; i < iz; ++i) {
        var index       = stream[i]["index"];
        var url         = stream[i]["url"];
        var duration    = stream[i]["duration"];
        var startTime   = stream[i]["fragment"][0];
        var endTime     = stream[i]["fragment"][1];

        if ( !(index in that._indexMap) ) { // new index
            that._bufferMap[index] = null;
            that._indexMap[index] = {
                "index":        index,
                "url":          url,
                "state":        STATE_NEW,
                "duration":     duration,
                "startTime":    startTime,
                "endTime":      endTime,
                "created_at":   now,
                "updated_at":   now,
            };
        }
    }
}

function _cache(that) {
    for (var indexString in that._indexMap) {
        var index = parseInt(indexString, 10);

        if (index >= that._seekHeadIndex) {
            if (that._indexMap[index]["state"] === STATE_NEW) {
                _load(that, index);
            }
        }
    }
    if (M3U8LiveSpooler["VERBOSE"]) {
        _dumpState(that);
    }
}

function _load(that, index) {
    var indexMap = that._indexMap;
    var url = indexMap[index]["url"];

    FileLoader["loadBlob"](url, function(blob) {
        if (index in indexMap) {
            if (indexMap[index]["state"] === STATE_NEW) {
                indexMap[index]["state"] = STATE_CACHED;
                indexMap[index]["updated_at"] = Date.now();

                if (M3U8LiveSpooler["VERBOSE"]) {
                    console.info("CACHED", {
                        "index":    parseInt(index, 10),
                        "duration": (that._cachedDuration) + " + " + (indexMap[index]["duration"]) + " -> " +
                                    (that._cachedDuration + indexMap[index]["duration"]),
                    });
                }

                that._bufferMap[index] = blob;
                that._cachedDuration += indexMap[index]["duration"];
            }
        }
    }, function(error) {
        indexMap[index]["state"]        = STATE_ERROR;
        indexMap[index]["updated_at"]   = Date.now();
        console.error("ERROR", {
            "index":    parseInt(index, 10),
            "message":  error.message,
        });
        if (error.message === "TIMEOUT") {
            if (that._eventCallback) {
                that._eventCallback({ "type": "timeout", "detail": { "url": url, "code": 408 } });
            }
        } else {
            if (that._eventCallback) {
                that._eventCallback({ "type": "error", "detail": { "url": url, "code": 404 } });
            }
        }
    });
}

function _dumpStream(playlist) {
    for (var i = 0, iz = playlist.stream.length; i < iz; ++i) {
        console.info("FETCH", { "index": playlist.stream[i]["index"], "duration": playlist.stream[i]["duration"] });
    }
}

function _dumpState(that) {
    var mark = [];

    for (var indexString in that._indexMap) {
        var index = parseInt(indexString, 10);

        switch (that._indexMap[index]["state"]) {
        case STATE_NEW:      mark.push("N"); break;
        case STATE_CACHED:   mark.push("C"); break;
        case STATE_USED:     mark.push("U"); break;
        case STATE_RELEASED: mark.push("R"); break;
        case STATE_ERROR:    mark.push("E"); break;
        }
    }
    console.info("STATE", mark.join(""));
}

return M3U8LiveSpooler; // return entity

});

