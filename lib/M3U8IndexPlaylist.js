(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("M3U8IndexPlaylist", function moduleClosure(global, WebModule, VERIFY /*, VERBOSE */) {
"use strict";

// --- technical terms / data structure --------------------
// --- dependency modules ----------------------------------
var M3U8 = WebModule["M3U8"];
// --- import / local extract functions --------------------
// --- define / local variables ----------------------------
// --- class / interfaces ----------------------------------
function M3U8IndexPlaylist(str) { // @arg IndexPlaylistString = "";
    if (str) {
        this._playlist = M3U8["parse"](str);
    } else {
        this._playlist = {
            "type":     "",
            "version":  0,
            "cache":    false,
            "duration": 0,
            "sequence": 0,
            "stream":   [],
        };
    }
}

M3U8IndexPlaylist["prototype"] = Object.create(M3U8IndexPlaylist, {
    "constructor":  { "value": M3U8IndexPlaylist        }, // new M3U8IndexPlaylist():M3U8IndexPlaylist
    "merge":        { "value": M3U8IndexPlaylist_merge  }, // M3U8IndexPlaylist#merge(str:indexPlaylistString:):void
    "has":          { "value": M3U8IndexPlaylist_has    }, // M3U8IndexPlaylist#has(sec:Number):Boolean
    "fetch":        { "value": M3U8IndexPlaylist_fetch  }, // M3U8IndexPlaylist#fetch(sec:Number):IndexPlaylistStreamObjectArray
    "clear":        { "value": M3U8IndexPlaylist_clear  }, // M3U8IndexPlaylist#clear():void
    "live":         { "get": function() { return this._playlist["type"] === "LIVE"; }, },
    "type":         { "get": function() { return this._playlist["type"];     }, },
    "version":      { "get": function() { return this._playlist["version"];  }, },
    "cache":        { "get": function() { return this._playlist["cache"];    }, },
    "duration":     { "get": function() { return this._playlist["duration"]; }, },
    "sequence":     { "get": function() { return this._playlist["sequence"]; }, },
    "stream":       { "get": function() { return this._playlist["stream"];   }, },
});

// --- implements ------------------------------------------
function M3U8IndexPlaylist_merge(str) { // @arg IndexPlaylistString
    var newList = M3U8["parse"](str);

    this._playlist["type"]     = newList["type"];
    this._playlist["version"]  = newList["version"];
    this._playlist["cache"]    = newList["cache"];
    this._playlist["duration"] = newList["duration"];
    this._playlist["sequence"] = newList["sequence"];
    this._playlist["stream"]   = _toUniqueArray(this._playlist["stream"], newList["stream"]);

    function _toUniqueArray(a, b) {
        var uniqueObjects = a.slice();
        var uniqueIndexes = [];

        for (var i = 0, iz = a.length; i < iz; ++i) {
            uniqueIndexes.push(a[i]["index"]);
        }
        for (i = 0, iz = b.length; i < iz; ++i) {
            var index = b[i]["index"];
            if (uniqueIndexes.indexOf(index) < 0) {
                uniqueIndexes.push(index);
                uniqueObjects.push(b[i]);
            }
        }
        return uniqueObjects;
    }
}

function _hasIndex(index,   // @arg UINT32
                   array) { // @arg IndexPlaylistStreamObjectArray
                            // @ret Boolean
    return array.some(function(obj) {
        return obj["index"] === index;
    });
}


function M3U8IndexPlaylist_has(sec) { // @arg Number
//{@dev
    if (VERIFY) {
        $valid($type(sec, "Number"), M3U8IndexPlaylist_has, "sec");
    }
//}@dev

    var stream = this._playlist["stream"];
    var totalDuration = 0;

    for (var i = 0, iz = stream.length; i < iz; ++i) {
        totalDuration += stream[i]["duration"];
        if (totalDuration >= sec) {
            return true;
        }
    }
    return false;
}

function M3U8IndexPlaylist_fetch(sec) { // @arg Number
                                        // @ret IndexPlaylistStreamObjectArray
//{@dev
    if (VERIFY) {
        $valid($type(sec, "Number"), M3U8IndexPlaylist_fetch, "sec");
    }
//}@dev

    if (this["has"](sec)) {
        var result = [];
        var totalDuration = 0;
        var stream = this._playlist["stream"];

        while (stream.length) {
            var obj = stream.shift();

            result.push(obj);
            totalDuration += obj["duration"];
            if (totalDuration >= sec) {
                return result;
            }
        }
    }
    return [];
}

function M3U8IndexPlaylist_clear() {
    this._playlist = {
        "type":     "",
        "version":  0,
        "cache":    false,
        "duration": 0,
        "sequence": 0,
        "stream":   [],
    };
}

return M3U8IndexPlaylist; // return entity

});

