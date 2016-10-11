(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("M3U8Spooler", function moduleClosure(global, WebModule, VERIFY, VERBOSE) {
"use strict";

// --- technical terms / data structure --------------------
// --- dependency modules ----------------------------------
var M3U8              = WebModule["M3U8"];
var M3U8LiveSpooler   = WebModule["M3U8LiveSpooler"];
var M3U8MovieSpooler  = WebModule["M3U8MovieSpooler"];
// --- import / local extract functions --------------------
// --- define / local variables ----------------------------
// --- class / interfaces ----------------------------------
function M3U8Spooler(eventCallback,  // @arg Function
                     videoCanPlay,   // @arg RegExp = /^(Base|Main)/
                     audioCanPlay) { // @arg RegExp = /AAC/
//{@dev
    if (VERIFY) {
        $valid($type(eventCallback, "Function"),    M3U8Spooler, "eventCallback");
        $valid($type(videoCanPlay,  "RegExp|omit"), M3U8Spooler, "videoCanPlay");
        $valid($type(audioCanPlay,  "RegExp|omit"), M3U8Spooler, "audioCanPlay");
    }
//}@dev

    this._eventCallback     = eventCallback || function(event) { // @arg EventLikeObject - { type, detail: { url, code } }
        console.log("M3U8Spooler::event", event["type"], event["detail"]);
    };
    this._src               = "";
    this._spooler           = null; // M3U8MovieSpooler|M3U8LiveSpooler
    this._masterPlaylist    = {};
    this._indexPlaylist     = {};
    this._videoCanPlay      = videoCanPlay || /^(Base|Main)/;   // video can play profile.
    this._audioCanPlay      = audioCanPlay || /AAC/;            // audio can play profile.
    this._selectedMasterStreamIndex = -1;
}

M3U8Spooler["VERBOSE"] = VERBOSE;
M3U8Spooler["prototype"] = Object.create(M3U8Spooler, {
    "constructor":  { "value": M3U8Spooler         }, // new M3U8Spooler(...):M3U8Spooler
    "has":          { "value": M3U8Spooler_has     }, // M3U8Spooler#has(ms:UINT32):Boolean
    "use":          { "value": M3U8Spooler_use     }, // M3U8Spooler#use(ms:UINT32):ChunkObject|null
    "seek":         { "value": M3U8Spooler_seek    }, // M3U8Spooler#seek(time:UINT32):IndexNumber
    "start":        { "value": M3U8Spooler_start   }, // M3U8Spooler#start():void
    "stop":         { "value": M3U8Spooler_stop    }, // M3U8Spooler#stop():void
    "clear":        { "value": M3U8Spooler_clear   }, // M3U8Spooler#clear():void
    "load":         { "value": M3U8Spooler_load    }, // M3U8Spooler#load(readyCallback, errorCallback):void
    "release":      { "value": M3U8Spooler_release }, // M3U8Spooler#release(indexes:UINT32Array):void
    "live":         { "get": function() { return this._indexPlaylist["type"] === "LIVE"; } },
    "src":          { "get": function()    { return this._src; },
                      "set": function(url) { this._src = url; }, },
    "cachedDuration": { "get": M3U8Spooler_getCachedDuration },
    "movieDuration":  { "get": M3U8Spooler_getMovieDuration  },
});

// --- implements ------------------------------------------
function M3U8Spooler_load(readyCallback,   // @arg Function - readyCallback():void
                          errorCallback) { // @arg Function - errorCallback(error:Error, url:URLString, code:HttpStatusCodeUINT16):void
    this["stop"]();
    this["clear"]();
    this._masterPlaylist = {};
    this._indexPlaylist  = {};

    _detectURLToPlaylist(this, this._src, readyCallback, errorCallback);
}

function _detectURLToPlaylist(that, url, readyCallback, errorCallback) {
    M3U8["load"](url, function(str, url) {
        if (M3U8Spooler["VERBOSE"]) {
            console.info("M3U8(MASTER)", url);
        }

        var playlist = M3U8["parse"](str, url); // MasterPlaylistObject|IndexPlaylistObject

        switch (playlist["type"]) {
        case "MASTER":
            _parseMasterPlaylist(that, playlist, url, readyCallback, errorCallback);
            break;
        case "LIVE":
        case "MOVIE":
            _createSpoolerInstance(that, playlist, url, readyCallback, errorCallback);
            break;
        }
    }, function(error, url, code) {
        console.error(error.message, url, code);
        errorCallback(error, url, code);
    }, { "timeout": 2000 });
}

function _parseMasterPlaylist(that, playlist, url, readyCallback, errorCallback) {
    that._masterPlaylist = playlist;
    var streamIndex = _selectBetterStream(that, playlist["stream"]);

    if (streamIndex >= 0) {
        that._selectedMasterStreamIndex = streamIndex;
        var stream = playlist["stream"][streamIndex]; // MasterPlaylistStreamObject - { url, info, bandwidth, codecs, video, audio }

        M3U8["load"](stream["url"], function(str, url) {
            if (M3U8Spooler["VERBOSE"]) {
                console.info("M3U8(INDEX)", url);
            }

            _createSpoolerInstance(that, M3U8["parse"](str, url), url, readyCallback, errorCallback);
        }, function(error, url, code) {
            console.error(error.message, url, code);
            errorCallback(error, url, code);
        }, { "timeout": 2000 });
    }
}

function _createSpoolerInstance(that, playlist, url, readyCallback, errorCallback) {
    that._indexPlaylist = playlist;

    switch (playlist["type"]) {
    case "LIVE":
        that._spooler = new M3U8LiveSpooler(playlist["url"], that._eventCallback);
        that["start"]();
        readyCallback();
        break;
    case "MOVIE":
        that._spooler = new M3U8MovieSpooler(playlist["url"], that._eventCallback);
        that["start"]();
        readyCallback();
        break;
    default:
        errorCallback(new Error("Unknown type"), "", 0);
    }
}

function M3U8Spooler_has(ms) { // @arg UINT32 - milliseconds
                               // @ret Boolean
    if (this._spooler) {
        return this._spooler["has"](ms);
    }
    return false;
}

function M3U8Spooler_use(ms) { // @arg UINT32 - milliseconds
                               // @ret ChunkObject|null - { stream:ObjectArray, indexes:UIN32Array, duration:UINT32, bytes:UINT32, buffer:ArrayBufferArray }
    if (this._spooler) {
        return this._spooler["use"](ms);
    }
    return null;
}

function M3U8Spooler_seek(time) { // @arg UINT32
                                  // @ret IndexNumber
    if (this._spooler) {
        return this._spooler["seek"](time);
    }
    return -1;
}

function M3U8Spooler_release(index) { // @arg UINT32
    if (this._spooler) {
        this._spooler["release"](index);
    }
}

function M3U8Spooler_start() {
    if (this._spooler) {
        this._spooler["start"]();
    }
}
function M3U8Spooler_stop() {
    if (this._spooler) {
        this._spooler["stop"]();
    }
}

function M3U8Spooler_clear() {
    if (this._spooler) {
        this._spooler["clear"]();
    }
}

function M3U8Spooler_getCachedDuration() {
    if (this._spooler) {
        return this._spooler["cachedDuration"];
    }
    return 0;
}

function M3U8Spooler_getMovieDuration() { // @ret UINT32 - ms
    if (this._spooler) {
        return this._spooler["movieDuration"];
    }
    return 0;
}

function _selectBetterStream(that,
                             masterStreams) { // @arg MasterPlaylistStreamObjectArray
                                              // @ret Number - UINT8 or -1
                                              // @desc selecting the appropriate HLS stream.
    for (var i = 0, iz = masterStreams.length; i < iz; ++i) {
        var stream = masterStreams[i];

        if ( that._videoCanPlay.test(stream["video"]["profile"]) &&
             that._audioCanPlay.test(stream["audio"]["profile"]) ) {
            return i; // H.264 Baseline profile, AAC-LC -> NICE
        }
    }
    return -1;
}

return M3U8Spooler; // return entity

});


