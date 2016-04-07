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

- MasterPlayListObject
    - MasterPlayListObject: { isMaster, version, stream }
        - isMaster:     Boolean
        - version:      UINT8
        - stream:       MasterPlayListStreamObjectArray
    - MasterPlayListStreamObjectArray: [MasterPlayListStreamObject, ...]
    - MasterPlayListStreamObject: { url, info, codecs, bandwidth, resolution, video, audio }
        - url:          URLString
        - info:         EXTStreamInfoString,
        - codecs:       String
        - bandwidth:    String
        - resolution:   String
        - video:        Object
            - codec:    String - "AVC", ""
            - profile:  String - "Base", "Main", "High"
            - level:    String - "1.3" ... "3.0" ... "5.1", ""
        - audio:        Object
            - codec:    String - "AAC", "MP3", ""
            - profile:  String - "AAC-LC", "HE-AAC", ""

- IndexPlayListObject
    - IndexPlayListObject: { isIndex, version, end, cache, duration, sequence, stream }
        - isIndex:      Boolean
        - version:      UINT8
        - end:          Boolean
        - cache:        Boolean
        - duration:     Number
        - sequence:     UINT32
        - stream:       IndexPlayListStreamObjectArray
    - IndexPlayListStreamObjectArray: [IndexPlayListStreamObject, ...]
    - IndexPlayListStreamObject: { url, duration, title }
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
    "parse":        M3U8_parse,  // M3U8.parse(str:M3U8FormatString):MasterPlayListObject|IndexPlayListObject|null
    "build":        M3U8_build,  // M3U8.build(playList:MasterPlayListObject|IndexPlayListObject):M3U8FormatString
    "repository":   "https://github.com/uupaa/M3U8.js",
};

// --- implements ------------------------------------------
function M3U8_parse(str) { // @arg M3U8FormatString - M3U8 format string
                          // @ret MasterPlayListObject|IndexPlayListObject|null
//{@dev
    if (VERIFY) {
        $valid($type(str, "String"), M3U8_parse, "str");
    }
//}@dev

    var isMasterPlayList = str.indexOf("#EXT-X-STREAM-INF") >= 0;
    var lines = str.trim().replace(/(\r\n|\r|\n)+/g, "\n").split("\n"); // line break normalize

    if (lines[0].trim() === "#EXTM3U") {
        return isMasterPlayList ? _parseMasterPlayList(lines) // { version, isMaster, stream }
                                : _patseIndexPlayList(lines); // { version, isIndex, end, cache, duration, sequence, stream }
    }
    return null;
}

function _parseMasterPlayList(lines) { // @arg LineStringArray - ["#EXTM3U", "#EXT-X-VERSION:3", ...]
                                       // @ret MasterPlayListObject
    var masterPlayListObject = {
            "version":  0,      // #EXT-X-VERSION value
            "isMaster": true,   // is MasterPlayList
            "stream":   [],     // MasterPlayListStreamObject: [{ url, codecs, bandwidth, resolution }, ...]
        };
    var masterPlayListStreamObject = [];
    var itemInfo = {};

    for (var i = 0, iz = lines.length; i < iz; ++i) {
        var line = lines[i].trim();
        if (line) {
            if (line[0] === "#") { // is comment line
                var record = line.split(":"); // "key:value" -> [key, value]
                var key    = record[0];
                var value  = record[1];

                switch (key) {
                case "#EXT-X-VERSION":    masterPlayListObject["version"] = parseFloat(value); break;
                case "#EXT-X-STREAM-INF": itemInfo = _parsePlayListStream(value);
                }
            } else {
                var codecs = _parseCodec(itemInfo["CODECS"] || "");

                masterPlayListStreamObject.push({
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
    masterPlayListObject["stream"] = masterPlayListStreamObject;

    return masterPlayListObject;
}

function _patseIndexPlayList(lines) { // @arg LineStringArray - ["#EXTM3U", "#EXT-X-VERSION:3", ...]
                                      // @ret IndexPlayListObject
    var indexPlayListObject = {
            "version":  0,      // #EXT-X-VERSION value
            "isIndex":  true,   // is IndexPlayList
            "end":      false,  // has #EXT-X-ENDLIST
            "cache":    false,  // has #EXT-X-ALLOW-CACHE
            "duration": 0,      // #EXT-X-TARGETDURATION value
            "sequence": 0,      // #EXT-X-MEDIA-SEQUENCE value
            "stream":   [],     // indexPlayListStreamObject [{ url, duration, title, bandwidth, codecs, resolution }, ...]
        };
    var indexPlayListStreamObject = [];
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
                case "#EXT-X-VERSION":        indexPlayListObject["version"]  = parseFloat(value); break;
                case "#EXT-X-ENDLIST":        indexPlayListObject["end"]      = true; break;
                case "#EXT-X-ALLOW-CACHE":    indexPlayListObject["cache"]    = value === "YES";   break;
                case "#EXT-X-TARGETDURATION": indexPlayListObject["duration"] = parseFloat(value); break;
                case "#EXT-X-MEDIA-SEQUENCE": indexPlayListObject["sequence"] = parseFloat(value); break;
                case "#EXTINF":               itemDuration = parseFloat(value);
                                              itemTitle    = value.split(",").slice(1).join(","); // "duration,title..."
                }
            } else {
                indexPlayListStreamObject.push({
                    "url":      line,
                    "duration": itemDuration || 0.0,
                    "title":    itemTitle    || ""
                });
            }
        }
    }
    indexPlayListObject["stream"] = indexPlayListStreamObject;

    return indexPlayListObject;
}

function _parsePlayListStream(streamInfo) { // @arg String - 'BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.2",RESOLUTION=432x768'
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

function M3U8_build(playList) { // @ret MasterPlayListObject|IndexPlayListObject
                                // @ret M3U8FormatString
//{@dev
    if (VERIFY) {
        $valid($type(playList, "Object"), M3U8_build, "playList");
        if (playList.isMaster) {
            $valid($type(playList.version,              "UINT8"),                           M3U8_build, "playList.version");
            $valid($type(playList.stream,               "MasterPlayListStreamObjectArray"), M3U8_build, "playList.stream");
            $valid($type(playList.stream[0].url,        "URLString"),                       M3U8_build, "playList.stream.url");
            $valid($type(playList.stream[0].codecs,     "String"),                          M3U8_build, "playList.stream.codecs");
            $valid($type(playList.stream[0].bandwidth,  "String"),                          M3U8_build, "playList.stream.bandwidth");
            $valid($type(playList.stream[0].resolution, "String"),                          M3U8_build, "playList.stream.resolution");
        } else if (playList.isIndex) {
            $valid($type(playList.version,              "UINT8"),                           M3U8_build, "playList.version");
            $valid($type(playList.stream,               "IndexPlayListObjectArray"),        M3U8_build, "playList.stream");
            $valid($type(playList.stream[0].url,        "URLString"),                       M3U8_build, "playList.stream.url");
            $valid($type(playList.stream[0].duration,   "Number"),                          M3U8_build, "playList.stream.duration");
        } else {
            $valid(false, M3U8_build, "BAD_FORMAT");
        }
    }
//}@dev

    var lines = ["#EXTM3U"];
    var isMasterPlayList = !!playList["isMaster"];

    if (playList["version"])  { lines.push("#EXT-X-VERSION:"        + playList["version"]);  }
    if (playList["end"])      { lines.push("#EXT-X-ENDLIST");                                }
    if (playList["cache"])    { lines.push("#EXT-X-ALLOW-CACHE:"    + (playList["cache"] ? "YES" : "NO")); }
    if (playList["duration"]) { lines.push("#EXT-X-TARGETDURATION:" + playList["duration"]); }
    if (playList["sequence"]) { lines.push("#EXT-X-MEDIA-SEQUENCE:" + playList["sequence"]); }

    var stream = playList["stream"];

    for (var i = 0, iz = stream.length; i < iz; ++i) {
        var buffer = [];
        var p = stream[i];
        if (isMasterPlayList) {
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

