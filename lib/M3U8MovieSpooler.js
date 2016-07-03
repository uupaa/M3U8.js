(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("M3U8MovieSpooler", function moduleClosure(global, WebModule, VERIFY, VERBOSE) {
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
var CACHE_THRESHOLD = 5 * 1024 * 1024; // 5MB
// --- class / interfaces ----------------------------------
function M3U8MovieSpooler(url,             // @arg URLString
                          eventCallback) { // @arg Function - eventCallback(event:Object):void
    this._src           = url; // IndexPlaylistObject
    this._eventCallback = eventCallback || function(event) { // @arg EventLikeObject - { type, detail }
        console.log("M3U8MovieSpooler::event", event["type"], event["detail"]);
    };
    this._fetchfn       = _fetch.bind(this);
    this._fetchTimerID  = 0; // fetch timer id. (setTimeout timer)
    this._fetchInterval = 10;
    this._bufferMap     = {}; // { index: Blob, ... }
    this._indexMap      = {}; // { index: { index, url, state, duration, created_at, updated_at }, ... }
    this._cachedBytes   = 0;
    this._cachedDuration = 0;
    this._lastM3U8String = ""; // diff check
    this._errorCount    = 0;
    this._live          = false;
}

M3U8MovieSpooler["VERBOSE"] = VERBOSE;
M3U8MovieSpooler["prototype"] = Object.create(M3U8MovieSpooler, {
    "constructor":  { "value": M3U8MovieSpooler         }, // new M3U8MovieSpooler(...):M3U8MovieSpooler
    "has":          { "value": M3U8MovieSpooler_has     }, // M3U8MovieSpooler#has(ms:UINT32):Boolean
    "use":          { "value": M3U8MovieSpooler_use     }, // M3U8MovieSpooler#use(ms:UINT32):ChunkObject|null
    "start":        { "value": M3U8MovieSpooler_start   }, // M3U8MovieSpooler#start():void
    "stop":         { "value": M3U8MovieSpooler_stop    }, // M3U8MovieSpooler#stop():void
    "clear":        { "value": M3U8MovieSpooler_clear   }, // M3U8MovieSpooler#clear():void
    "release":      { "value": M3U8MovieSpooler_release }, // M3U8MovieSpooler#release(indexes:UINT32Array):void
    "cachedBytes":  { "get": function() { return this._cachedBytes; } },
    "cachedDuration": { "get": function() { return this._cachedDuration; } },
});

// --- implements ------------------------------------------
function M3U8MovieSpooler_start() {
    this["stop"]();
    this._fetchfn();
}

function M3U8MovieSpooler_stop() {
    if (this._fetchTimerID) {
        clearTimeout(this._fetchTimerID);
        this._fetchTimerID = 0;
    }
}

function _fetch() {
    var that = this;

    if (this._src) {
        M3U8["load"](this._src, function(m3u8, url) {
            that._fetchTimerID = setTimeout(that._fetchfn, that._fetchInterval); // fetch timer restart.

            if (that._lastM3U8String !== m3u8) { // modified?
                that._lastM3U8String = m3u8;

                var playlist = M3U8["parse"](m3u8, url); // IndexPlaylistObject

                if (playlist) {
                    if (M3U8MovieSpooler["VERBOSE"]) {
                        _dumpStream(playlist);
                    }

                    that._fetchInterval = (playlist["duration"] <= 3000) ? 400 : 1000;

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

            that._fetchTimerID = setTimeout(that._fetchfn, that._fetchInterval); // fetch timer restart.

            if (++that._errorCount >= 3) {
                clearTimeout(that._fetchTimerID);
                that._fetchTimerID = 0;
                that._eventCallback({ "type": "error", "detail": code });
            }
        });
    }
}

function M3U8MovieSpooler_has(ms) { // @arg UINT32 - milliseconds
    var duration = 0;

    for (var index in this._indexMap) {
        var obj = this._indexMap[index];

        if (obj["state"] === STATE_CACHED) {
            duration += obj["duration"];
            if (duration >= ms) {
                return true;
            }
        }
    }
    return false;
}

function M3U8MovieSpooler_use(ms) { // @arg UINT32 - milliseconds
                                    // @ret ChunkObject|null - { stream:ObjectArray, indexes:UIN32Array, duration:UINT32, buffer:ArrayBufferArray }
    var bytes = 0;
    var indexes = [];
    var duration = 0;
    var result = {
        "stream":   [],
        "indexes":  [], // UINT32 - [index, ...]
        "duration": 0,
        "buffer":   [], // ArrayBufferArray
    };

    for (var index in this._indexMap) {
        var obj = this._indexMap[index];

        if (obj["state"] === STATE_CACHED) {
            obj["state"] = STATE_USED;
            obj["updated_at"] = Date.now();

            bytes    += this._bufferMap[index]["size"]; // Blob.size
            duration += obj["duration"];
            indexes.push( parseInt(index, 10) );

            result["buffer"].push(this._bufferMap[index]);
            result["stream"].push(obj);

            if (duration >= ms) {
                result["indexes"]  = indexes;
                result["duration"] = duration;

                if (M3U8MovieSpooler["VERBOSE"]) {
                    console.info("USE", {
                        "indexes":  indexes.join(","),
                        "duration": this._cachedDuration + " - " + duration + " -> " + (this._cachedDuration - duration),
                    });
                }

                // reduce cache
                this._cachedBytes    -= bytes;
                this._cachedDuration -= duration;
                return result;
            }
        }
    }
    return result;
}

function M3U8MovieSpooler_release(indexes) { // @arg UINT32Array - [index, ...]
    for (var i = 0, iz = indexes.length; i < iz; ++i) {
        var index = indexes[i];

        this._indexMap[index]["state"] = STATE_RELEASED;
        this._indexMap[index]["updated_at"] = Date.now();
        this._bufferMap[index] = null;
    }
}

function M3U8MovieSpooler_clear() {
    this._src           = "";
    this._bufferMap     = {};
    this._indexMap      = {};
    this._cachedBytes   = 0;
    this._errorCount    = 0;
}

function _merge(that, stream) { // @arg IndexPlaylistStreamObjectArray
    var now = Date.now();

    for (var i = 0, iz = stream.length; i < iz; ++i) {
        var index    = stream[i]["index"];
        var url      = stream[i]["url"];
        var duration = stream[i]["duration"];

        if ( !(index in that._indexMap) ) { // new index
            that._bufferMap[index] = null;
            that._indexMap[index] = {
                "index":        index,
                "url":          url,
                "state":        STATE_NEW,
                "duration":     duration,
                "created_at":   now,
                "updated_at":   now,
            };
        }
    }
}

function _cache(that) {
    var bufferMap = that._bufferMap;
    var indexMap = that._indexMap;

    if (that._cachedBytes >= CACHE_THRESHOLD) {
        console.warn("CACHE OVER THRESHOLD: ", that._cachedBytes, ">=", CACHE_THRESHOLD);
        return;
    }

    for (var index in indexMap) {
        if (indexMap[index]["state"] === STATE_NEW) {
            _load(index, indexMap);
        }
    }

    function _load(index, indexMap) {
        FileLoader["loadBlob"](indexMap[index]["url"], function(blob) {
            if (index in indexMap) {
                if (indexMap[index]["state"] === STATE_NEW) {
                    indexMap[index]["state"] = STATE_CACHED;
                    indexMap[index]["updated_at"] = Date.now();

                    if (M3U8MovieSpooler["VERBOSE"]) {
                        console.info("CACHED", {
                            "index":    parseInt(index, 10),
                            "duration": (that._cachedDuration) + " + " + (indexMap[index]["duration"]) + " -> " +
                                        (that._cachedDuration + indexMap[index]["duration"]),
                        });
                    }

                    bufferMap[index]      = blob;
                    that._cachedBytes    += blob["size"];
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
        });
    }
}

function _dumpStream(playlist) {
    for (var i = 0, iz = playlist.stream.length; i < iz; ++i) {
        console.info("FETCH", { "index": playlist.stream[i]["index"],  "duration": playlist.stream[i]["duration"] });
    }
}

return M3U8MovieSpooler; // return entity

});

