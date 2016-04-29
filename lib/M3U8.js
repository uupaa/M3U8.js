(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("M3U8", function moduleClosure(global, WebModule, VERIFY/*, VERBOSE */) {
"use strict";

// --- data struct / technical terms -----------------------
/*

- MasterPlaylistObject
    - MasterPlaylistObject: { type, version, stream }
        - type:         String - "MASTER"
        - version:      UINT8
        - stream:       MasterPlaylistStreamObjectArray
    - MasterPlaylistStreamObjectArray: [MasterPlaylistStreamObject, ...]
    - MasterPlaylistStreamObject: { url, info, codecs, bandwidth, resolution, video, audio }
        - url:          URLString
        - info:         EXTStreamInfoString,
        - codecs:       String
        - bandwidth:    String
        - resolution:   String - "432x768"
        - video:        Object
            - codec:    String - "AVC", ""
            - profile:  String - "Base", "Main", "High"
            - level:    String - "1.3" ... "3.0" ... "5.1", ""
        - audio:        Object
            - codec:    String - "AAC", "MP3", ""
            - profile:  String - "AAC-LC", "HE-AAC", ""

- IndexPlaylistObject
    - IndexPlaylistObject: { type, version, end, cache, duration, sequence, stream }
        - type:         String - "INDEX"
        - version:      UINT8
        - end:          Boolean
        - cache:        Boolean
        - duration:     Number
        - sequence:     UINT32
        - stream:       IndexPlaylistStreamObjectArray
    - IndexPlaylistStreamObjectArray: [IndexPlaylistStreamObject, ...]
    - IndexPlaylistStreamObject: { index, url, duration, title }
        - index:        UINT32
        - url:          URLString
        - duration:     Number
        - title:        String

- HLS CODECS
    - https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/StreamingMediaGuide/FrequentlyAskedQuestions/FrequentlyAskedQuestions.html

 */

// --- dependency modules ----------------------------------
var H264Profile = WebModule["H264Profile"];
var AACProfile  = WebModule["AACProfile"];
// --- import / local extract functions --------------------
// --- define / local variables ----------------------------
// --- class / interfaces ----------------------------------
var M3U8 = {
    "parse":        M3U8_parse,  // M3U8.parse(str:M3U8FormatString):MasterPlaylistObject|IndexPlaylistObject|null
    "build":        M3U8_build,  // M3U8.build(playList:MasterPlaylistObject|IndexPlaylistObject):M3U8FormatString
    "repository":   "https://github.com/uupaa/M3U8.js",
};

// --- implements ------------------------------------------
function M3U8_parse(str) { // @arg M3U8FormatString - M3U8 format string
                           // @ret MasterPlaylistObject|IndexPlaylistObject|null
//{@dev
    if (VERIFY) {
        $valid($type(str, "String"), M3U8_parse, "str");
    }
//}@dev

    var isMasterPlaylist = str.indexOf("#EXT-X-STREAM-INF") >= 0;
    var lines = str.trim().replace(/(\r\n|\r|\n)+/g, "\n").split("\n"); // line break normalize

    if (lines[0].trim() === "#EXTM3U") {
        return isMasterPlaylist ? _parseMasterPlaylist(lines) // { type, version, stream }
                                : _patseIndexPlaylist(lines); // { type, version, end, cache, duration, sequence, stream }
    }
    return null;
}

function _parseMasterPlaylist(lines) { // @arg LineStringArray - ["#EXTM3U", "#EXT-X-VERSION:3", ...]
                                       // @ret MasterPlaylistObject
    var masterPlaylistObject = {
            "type":     "MASTER",   // is MasterPlaylist
            "version":  0,          // #EXT-X-VERSION value
            "isMaster": true,       // is MasterPlaylist // [DEPRECATED]
            "stream":   [],         // MasterPlaylistStreamObject: [{ url, codecs, bandwidth, resolution }, ...]
        };
    var masterPlaylistStreamObject = [];
    var itemInfo = {};

    for (var i = 0, iz = lines.length; i < iz; ++i) {
        var line = lines[i].trim();
        if (line) {
            if (line[0] === "#") { // is comment line
                var record = line.split(":"); // "key:value" -> [key, value]
                var key    = record[0];
                var value  = record[1];

                switch (key) {
                case "#EXT-X-VERSION":    masterPlaylistObject["version"] = parseFloat(value); break;
                case "#EXT-X-STREAM-INF": itemInfo = _parsePlaylistStream(value);
                }
            } else {
                var codecs = _parseCodec(itemInfo["CODECS"] || "");

                masterPlaylistStreamObject.push({
                    "url":          line,
                    "info":         itemInfo["info"].trim(),
                    "codecs":       itemInfo["CODECS"]     || "",
                    "bandwidth":    itemInfo["BANDWIDTH"]  || "",
                    "resolution":   itemInfo["RESOLUTION"] || "",
                    "video": {
                        "codec":    codecs.video.codec,
                        "profile":  codecs.video.profile,
                        "level":    codecs.video.level,
                    },
                    "audio": {
                        "codec":    codecs.audio.codec,
                        "profile":  codecs.audio.profile,
                    },
                });
            }
        }
    }
    masterPlaylistObject["stream"] = masterPlaylistStreamObject;

    return masterPlaylistObject;
}

function _patseIndexPlaylist(lines) { // @arg LineStringArray - ["#EXTM3U", "#EXT-X-VERSION:3", ...]
                                      // @ret IndexPlaylistObject
    var indexPlaylistObject = {
            "type":     "INDEX",    // is IndexPlaylist
            "version":  0,          // #EXT-X-VERSION value
            "isIndex":  true,       // is IndexPlaylist [DEPRECATED]
            "end":      false,      // has #EXT-X-ENDLIST
            "cache":    false,      // has #EXT-X-ALLOW-CACHE
            "duration": 0,          // #EXT-X-TARGETDURATION value
            "sequence": 0,          // #EXT-X-MEDIA-SEQUENCE value
            "stream":   [],         // indexPlaylistStreamObject [{ index, url, duration, title, bandwidth, codecs, resolution }, ...]
        };
    var indexPlaylistStreamObject = [];
    var itemTitle = "";
    var itemDuration = "";

    for (var i = 0, iz = lines.length; i < iz; ++i) {
        var line = lines[i].trim();
        if (line) {
            if (line[0] === "#") { // is comment line
                var record = line.split(":"); // "key:value" -> [key, value]
                var key    = record[0];
                var value  = record[1];

                switch (key) {
                case "#EXT-X-VERSION":        indexPlaylistObject["version"]  = parseFloat(value); break;
                case "#EXT-X-ENDLIST":        indexPlaylistObject["end"]      = true; break;
                case "#EXT-X-ALLOW-CACHE":    indexPlaylistObject["cache"]    = value === "YES";   break;
                case "#EXT-X-TARGETDURATION": indexPlaylistObject["duration"] = parseFloat(value); break;
                case "#EXT-X-MEDIA-SEQUENCE": indexPlaylistObject["sequence"] = parseFloat(value); break;
                case "#EXTINF":               itemDuration = parseFloat(value);
                                              itemTitle    = value.split(",").slice(1).join(","); // "duration,title..."
                }
            } else {
                indexPlaylistStreamObject.push({
                    "index":    indexPlaylistObject["sequence"] + indexPlaylistStreamObject.length,
                    "url":      line,
                    "duration": itemDuration || 0.0,
                    "title":    itemTitle    || ""
                });
            }
        }
    }
    indexPlaylistObject["stream"] = indexPlaylistStreamObject;

    return indexPlaylistObject;
}

function _parsePlaylistStream(streamInfo) { // @arg String - 'BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.2",RESOLUTION=432x768'
                                            // @ret Object - { BANDWIDTH: "710852", CODECS: "avc1.66.30,mp4a.40.2", RESOLUTION: "432x768", info: "BANDWIDTH=710852..." }
                                            // @desc parse "key=value,..." -> { key: value, ... }
    var result  = { "info": streamInfo };
    var inQuote = false; // in "..."
    var inKey   = true;  // in key=value
    var key     = "";
    var value   = "";

    for (var i = 0, iz = streamInfo.length; i < iz; ++i) {
        var tokenEnd = (i === iz - 1) ? true : false;
        var c = streamInfo[i];

        if (inQuote) {
            switch (c) {
            case '"': inQuote = false; break;
            default:  if (inKey) { key += c;      } else { value += c; }
            }
        } else {
            switch (c) {
            case '"': inQuote = true; break;
            case '=': if (inKey) { inKey = false; } else { value += c;      } break;
            case ',': if (inKey) { key += c;      } else { tokenEnd = true; } break;
            default:  if (inKey) { key += c;      } else { value += c;      }
            }
        }
        if (tokenEnd) {
            result[key] = value;
            inKey = true;
            key   = "";
            value = "";
        }
    }
    return result;
}

function M3U8_build(playList) { // @ret MasterPlaylistObject|IndexPlaylistObject
                                // @ret M3U8FormatString
//{@dev
    if (VERIFY) {
        $valid($type(playList, "Object"), M3U8_build, "playList");
        if (playList.type === "MASTER") {
            $valid($type(playList.version,              "UINT8"),                           M3U8_build, "playList.version");
            $valid($type(playList.stream,               "MasterPlaylistStreamObjectArray"), M3U8_build, "playList.stream");
            $valid($type(playList.stream[0].url,        "URLString"),                       M3U8_build, "playList.stream.url");
            $valid($type(playList.stream[0].codecs,     "String"),                          M3U8_build, "playList.stream.codecs");
            $valid($type(playList.stream[0].bandwidth,  "String"),                          M3U8_build, "playList.stream.bandwidth");
            $valid($type(playList.stream[0].resolution, "String"),                          M3U8_build, "playList.stream.resolution");
        } else if (playList.type === "INDEX") {
            $valid($type(playList.version,              "UINT8"),                           M3U8_build, "playList.version");
            $valid($type(playList.stream,               "IndexPlaylistObjectArray"),        M3U8_build, "playList.stream");
            $valid($type(playList.stream[0].url,        "URLString"),                       M3U8_build, "playList.stream.url");
            $valid($type(playList.stream[0].duration,   "Number"),                          M3U8_build, "playList.stream.duration");
        } else {
            $valid(false, M3U8_build, "Unknown Type: " + playList.type);
        }
    }
//}@dev

    var lines = ["#EXTM3U"];
    var isMasterPlaylist = playList["type"] === "MASTER";

    if (playList["version"])  { lines.push("#EXT-X-VERSION:"        + playList["version"]);  }
    if (playList["end"])      { lines.push("#EXT-X-ENDLIST");                                }
    if (playList["cache"])    { lines.push("#EXT-X-ALLOW-CACHE:"    + (playList["cache"] ? "YES" : "NO")); }
    if (playList["duration"]) { lines.push("#EXT-X-TARGETDURATION:" + playList["duration"]); }
    if (playList["sequence"]) { lines.push("#EXT-X-MEDIA-SEQUENCE:" + playList["sequence"]); }

    var stream = playList["stream"];

    for (var i = 0, iz = stream.length; i < iz; ++i) {
        var buffer = [];
        var p = stream[i];
        if (isMasterPlaylist) {
            if (p["bandwidth"])  { buffer.push("BANDWIDTH="  + p["bandwidth"]);      }
            if (p["codecs"])     { buffer.push("CODECS="     + _quote(p["codecs"])); }
            if (p["resolution"]) { buffer.push("RESOLUTION=" + p["resolution"]);     }
            lines.push("#EXT-X-STREAM-INF:" + buffer.join(","));
            lines.push(p["url"]);
        } else {
            if (p["duration"])   { buffer.push(p["duration"]); }
            if (p["title"])      { buffer.push(p["title"]);    }
            lines.push("#EXTINF:" + buffer.join(","));
            lines.push(p["url"]);
        }
    }
    return lines.join("\n");
}

function _quote(str) {
    return '"' + str + '"';
}

function _parseCodec(str) { // @arg CodecString - eg: "avc1.4D401E, mp4a.40.2"
                            // @ret CodecObject - { video: { codec, profile, level }, audio: { codec, profile } }
    var video = {
            codec:   "", // "AVC"
            profile: "", // "Base", "Main", "High"
            level:   "", // "3.0", "4.1"
        };
    var audio = {
            codec:   "", // "AAC", "MP3"
            profile: "", // "AAC-LC", "HE-AAC", ""
        };

    var codecArray = str.split(",");

    for (var i = 0, iz = codecArray.length; i < iz; ++i) {
        var codecs = codecArray[i].trim(); // "avc1.42c01e"

        if ( /^avc1/.test(codecs) ) {
            video.codec   = "AVC";
            video.profile = H264Profile["getProfile"](codecs);  // "Base", "Main", "High", ""
            video.level   = H264Profile["getLevel"](codecs);    // "3.0", "4.1"
        } else if ( /^mp4a/.test(codecs) ) {
            audio.codec   = "AAC";
            audio.profile = AACProfile["getProfile"](codecs);   // "AAC-LC", "HE-AAC", "MP3", ""
            if (audio.profile === "MP3") {
                audio.codec   = "MP3";
                audio.profile = "";
            }
        }
    }
    return { video: video, audio: audio };
}

return M3U8; // return entity

});

