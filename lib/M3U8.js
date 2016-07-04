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
    - MasterPlaylistObject: { url, type, version, stream }
        - url:          MasterPlaylistURLString
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
            - profile:  String - "AAC-LC", "HE-AAC", "HE-AAC v2", "MP3", ""
            - objectType: AudioObjectType - 2(AAC-LC), 5(HE-AAC), 29(HE-AAC v2), 34(MP3) 0

- IndexPlaylistObject
    - IndexPlaylistObject: { url, type, version, cache, sequence, stream, duration, targetDuration }
        - url:          IndexPlaylistURLString
        - type:         String - "MOVIE" or "LIVE"
        - version:      UINT8
        - cache:        Boolean
        - sequence:     UINT32
        - stream:       IndexPlaylistStreamObjectArray
        - duration:     UINT32
        - targetDuration: UINT32
    - IndexPlaylistStreamObjectArray: [IndexPlaylistStreamObject, ...]
    - IndexPlaylistStreamObject: { index, url, duration, title, fragment }
        - index:        UINT32
        - url:          URLString
        - duration:     UINT32
        - title:        String
        - fragment:     MovieFragmentPositionNumberArray - [startTime, endTime]

- HLS CODECS
    - https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/StreamingMediaGuide/FrequentlyAskedQuestions/FrequentlyAskedQuestions.html

 */

// --- dependency modules ----------------------------------
var URI         = WebModule["URI"];
var FileLoader  = WebModule["FileLoader"];
var AACProfile  = WebModule["AACProfile"];
var H264Profile = WebModule["H264Profile"];
// --- import / local extract functions --------------------
// --- define / local variables ----------------------------
// --- class / interfaces ----------------------------------
var M3U8 = {
    "load":         M3U8_load,   // M3U8.load(url:PlaylistURLString, readyCallback:Function, errorCallback:Function = null):void
    "parse":        M3U8_parse,  // M3U8.parse(str:M3U8FormatString, url:PlaylistURLString = ""):MasterPlaylistObject|IndexPlaylistObject|null
    "build":        M3U8_build,  // M3U8.build(playlist:MasterPlaylistObject|IndexPlaylistObject):M3U8FormatString
    "repository":   "https://github.com/uupaa/M3U8.js",
};

// --- implements ------------------------------------------
function M3U8_load(url,           // @arg PlaylistURLString - M3U8 format string
                   readyCallback, // @arg Function - readyCallback(str:M3U8FormatString, url:URLString):void
                   errorCallback, // @arg Function - errorCallback(error:Error, url:URLString):void
                   options) {     // @arg Object - { timeout:UINT32, dump:Boolean }
    FileLoader["loadString"](url, readyCallback, errorCallback, options);
}

function M3U8_parse(str,           // @arg M3U8FormatString - M3U8 format string
                    playlistURL) { // @arg PlaylistURLString = ""
                                   // @ret MasterPlaylistObject|IndexPlaylistObject|null
//{@dev
    if (VERIFY) {
        $valid($type(str,         "String"),         M3U8_parse, "str");
        $valid($type(playlistURL, "URLString|omit"), M3U8_parse, "playlistURL");
    }
//}@dev

    playlistURL = playlistURL || "";

    var isMasterPlaylist = str.indexOf("#EXT-X-STREAM-INF") >= 0;
    var lines = str.trim().replace(/(\r\n|\r|\n)+/g, "\n").split("\n"); // line break normalize

    if (lines[0].trim() === "#EXTM3U") {
        return isMasterPlaylist ? _parseMasterPlaylist(lines, playlistURL)  // { url, type, version, stream }
                                : _patseIndexPlaylist(lines,  playlistURL); // { url, type, version, end, cache, duration, targetDuration, sequence, stream }
    }
    return null;
}

function _parseMasterPlaylist(lines,         // @arg LineStringArray - ["#EXTM3U", "#EXT-X-VERSION:3", ...]
                              playlistURL) { // @arg MasterPlaylistURLString
                                             // @ret MasterPlaylistObject
    var masterPlaylistObject = {
            "url":      playlistURL,// MasterPlaylistURL
            "type":     "MASTER",   // MasterPlaylist ident
            "version":  0,          // #EXT-X-VERSION value
            "stream":   [],         // MasterPlaylistStreamObjectArray: [{ url, codecs, bandwidth, resolution }, ...]
        };
    var stream = [];
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

                stream.push({
                    "url":          _toAbsoluteURL(line, playlistURL),
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
                        "objectType": codecs.audio.objectType,
                    },
                });
            }
        }
    }
    masterPlaylistObject["stream"] = stream;

    return masterPlaylistObject;
}

function _patseIndexPlaylist(lines,         // @arg LineStringArray - ["#EXTM3U", "#EXT-X-VERSION:3", ...]
                             playlistURL) { // @arg IndexPlaylistURLString
                                            // @ret IndexPlaylistObject
    var indexPlaylistObject = {
            "url":      playlistURL,// IndexPlaylistURL
            "type":     "LIVE",     // IndexPlaylist type. "MOVIE" or "LIVE"
            "version":  0,          // #EXT-X-VERSION value
            "cache":    false,      // has #EXT-X-ALLOW-CACHE
            "sequence": 0,          // #EXT-X-MEDIA-SEQUENCE value
            "stream":   [],         // IndexPlaylistStreamObjectArray [{ index, url, duration, title, fragment }, ...]
            "duration": 0,          // ts duraions UINT32
            "targetDuration": 0,    // #EXT-X-TARGETDURATION UINT32 (ms)
        };
    var stream      = [];
    var tsTitle     = "";
    var tsDuration  = 0; // ms
    var startTime   = 0; // ms

    for (var i = 0, iz = lines.length; i < iz; ++i) {
        var line = lines[i].trim();
        if (line) {
            if (line[0] === "#") { // is comment line
                var record = line.split(":"); // "key:value" -> [key, value]
                var key    = record[0];
                var value  = record[1];

                switch (key) {
                case "#EXT-X-VERSION":        indexPlaylistObject["version"]  = parseFloat(value); break;
                case "#EXT-X-ENDLIST":        indexPlaylistObject["type"]     = "MOVIE";           break;
                case "#EXT-X-ALLOW-CACHE":    indexPlaylistObject["cache"]    = value === "YES";   break;
                case "#EXT-X-TARGETDURATION": indexPlaylistObject["targetDuration"] = (parseFloat(value) * 1000) | 0; break;
                case "#EXT-X-MEDIA-SEQUENCE": indexPlaylistObject["sequence"] = parseInt(value); break;
                case "#EXTINF":               tsDuration = (parseFloat(value) * 1000) | 0;
                                              tsTitle    = value.split(",").slice(1).join(","); // "duration,title..."
                }
            } else {
                stream.push({
                    "index":    indexPlaylistObject["sequence"] + stream.length,
                    "url":      _toAbsoluteURL(line, playlistURL),
                    "duration": tsDuration || 0,
                    "title":    tsTitle    || "",
                    "fragment": [startTime, startTime + tsDuration], // [startTime, endTime]
                });
                startTime  += tsDuration;
                tsDuration  = 0; // reset
                tsTitle     = "";
            }
        }
    }
    indexPlaylistObject["stream"] = stream;

    if (indexPlaylistObject["type"] === "MOVIE") {
        indexPlaylistObject["duration"] = startTime;
    }

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

function M3U8_build(playlist) { // @ret MasterPlaylistObject|IndexPlaylistObject
                                // @ret M3U8FormatString
//{@dev
    if (VERIFY) {
        $valid($type(playlist, "Object"), M3U8_build, "playlist");
        if (playlist.type === "MASTER") {
            $valid($type(playlist.version,              "UINT8"),                           M3U8_build, "playlist.version");
            $valid($type(playlist.stream,               "MasterPlaylistStreamObjectArray"), M3U8_build, "playlist.stream");
            $valid($type(playlist.stream[0].url,        "URLString"),                       M3U8_build, "playlist.stream.url");
            $valid($type(playlist.stream[0].codecs,     "String"),                          M3U8_build, "playlist.stream.codecs");
            $valid($type(playlist.stream[0].bandwidth,  "String"),                          M3U8_build, "playlist.stream.bandwidth");
            $valid($type(playlist.stream[0].resolution, "String"),                          M3U8_build, "playlist.stream.resolution");
        } else if (playlist.type === "MOVIE" ||
                   playlist.type === "LIVE") {
            $valid($type(playlist.version,              "UINT8"),                           M3U8_build, "playlist.version");
            $valid($type(playlist.stream,               "IndexPlaylistObjectArray"),        M3U8_build, "playlist.stream");
            $valid($type(playlist.stream[0].url,        "URLString"),                       M3U8_build, "playlist.stream.url");
            $valid($type(playlist.stream[0].duration,   "UINT32"),                          M3U8_build, "playlist.stream.duration");
        } else {
            $valid(false, M3U8_build, "Unknown Type: " + playlist.type);
        }
    }
//}@dev

    var lines = ["#EXTM3U"];
    var isMasterPlaylist = playlist["type"] === "MASTER";

    if (playlist["version"])  { lines.push("#EXT-X-VERSION:"        + playlist["version"]);  }
    if (playlist["cache"])    { lines.push("#EXT-X-ALLOW-CACHE:"    + (playlist["cache"] ? "YES" : "NO")); }
    if (playlist["targetDuration"]) { lines.push("#EXT-X-TARGETDURATION:" + (playlist["targetDuration"] / 1000).toFixed(0)); }
    if (playlist["sequence"]) { lines.push("#EXT-X-MEDIA-SEQUENCE:" + playlist["sequence"]); }
    if (playlist["type"] === "MOVIE") { lines.push("#EXT-X-ENDLIST"); }

    var stream = playlist["stream"];

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
            if (p["duration"])   { buffer.push(p["duration"] / 1000); }
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
                            // @ret CodecObject - { video: { codec, profile, level }, audio: { codec, profile, objectType } }
    var video = {
            codec:   "", // "AVC"
            profile: "", // "Base", "Main", "High"
            level:   "", // "3.0", "4.1"
        };
    var audio = {
            codec:   "", // "AAC", "MP3"
            profile: "", // "AAC-LC", "HE-AAC", "HE-AAC v2", "MP3", ""
            objectType: 0, // 2, 5, 29, 34, ...
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
            audio.profile = AACProfile["getProfile"](codecs);   // "AAC-LC", "HE-AAC", "HE-AAC v2", "MP3", ""
            audio.objectType = AACProfile["getAudioObjectType"](codecs); // 2, 5, 29, 34

            if (audio.profile === "MP3") {
                audio.codec = "MP3";
            }
        }
    }
    return { video: video, audio: audio };
}

function _toAbsoluteURL(tsURL, baseURL) {
    if (!baseURL || URI["isAbsolute"](tsURL)) {
        return tsURL;
    }
    return URI["resolve"]( URI["getBaseURL"](baseURL) + tsURL );
}

return M3U8; // return entity

});

