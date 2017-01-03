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

# Master playlist

- MasterPlaylistObject: { url, type, version, streams }
    - url:          MasterPlaylistURLString
    - type:         String - "MASTER"
    - version:      UINT8 - "#EXT-X-VERSION:<number>"
    - streams:      MasterStreamObjectArray
- MasterStreamObjectArray: [MasterStreamObject, ...]
- MasterStreamObject: { url, info, codecs, bandwidth, resolution, video, audio }
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

# Media playlist

- MediaPlaylistObject: { url, type, version, allowCache, mediaSequence, mediaSegments, targetDuration, totalDurations }
    - url:              MediaPlaylistURLString
    - type:             String - "VOD" or "LIVE"
    - version:          UINT8 - "#EXT-X-VERSION:<number = 3>"
    - allowCache:       Boolean - "#EXT-X-ALLOW-CACHE:<YES OR NO = NO>"
    - mediaSequence:    UINT32 - "#EXT-X-MEDIA-SEQUENCE:<number = 0>"
    - mediaSegments:    MediaSegmentObjectArray
    - targetDuration:   UINT32 - "#EXT-X-TARGETDURATION:<number>" (msec value)
    - totalDurations:   UINT32 - sum of the segment durations (VOD only)
- MediaSegmentObjectArray: [MediaSegmentObject, ...]
- MediaSegmentObject: { tsID, tsURL, tsDuration, tsRange, tsTitle }
    - tsID:             UINT32
    - tsURL:            URLString
    - tsDuration:       UINT32 - #EXTINF:<duration>
    - tsRange:          Object - { startTime: UINT32, endTime: UINT32 }
    - tsTitle:          String - #EXTINF:<duration>,[<title>]

# Spec

- DRAFT https://tools.ietf.org/html/draft-pantos-http-live-streaming-20

- HLS CODECS
    - https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/StreamingMediaGuide/FrequentlyAskedQuestions/FrequentlyAskedQuestions.html

- `#EXT-TARGETDURATION:<number>` は最大セグメント時間を示しており、各セグメントのduration(`#EXTINF:<durtaion>`) は最大セグメント時間を超えてはならない(MUST)
    - サーバ上の Media playlist は `#EXT-TARGETDURATION` の0.5〜1.5倍の時間の間はサーバ側で存在が補償されている必要がある
    - このことから playlist の再取得間隔は `#EXT-TARGETDURATION` を指標とすることが可能である
- サーバーがプレゼンテーション全体を削除したい場合は、再生リストファイルがもはや利用できないことをクライアントに明示すべきである(例えば 404 or 410応答)
- `#EXT-X-MEDIA-SEQUENCE:<number>` はLive playlist において常にインクリメントされていく必要がある
- tsRange.startTime は累積的な再生開始位置
- tsRange.endTime は tsRange.startTime + tsDuration から得られる累積的な再生終了位置


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
    "load":         M3U8_load,   // M3U8.load(url:PlaylistURLString, readyCallback:Function, errorCallback:Function = null, options:Object = null):void
    "trim":         M3U8_trim,   // M3U8.trim(playlist:MediaPlaylistObject, options:Object = null):MediaPlaylistObject
    "parse":        M3U8_parse,  // M3U8.parse(m3u8:M3U8FormatString, url:PlaylistURLString = ""):MasterPlaylistObject|MediaPlaylistObject|null
    "build":        M3U8_build,  // M3U8.build(playlist:MasterPlaylistObject|MediaPlaylistObject):M3U8FormatString
    "repository":   "https://github.com/uupaa/M3U8.js",
};

// --- implements ------------------------------------------
function M3U8_load(url,           // @arg URLString - MasterPlaylist or MediaPlaylist
                   readyCallback, // @arg Function - readyCallback(m3u8:M3U8FormatString, url:URLString):void
                   errorCallback, // @arg Function - errorCallback(error:Error, url:URLString):void
                   options) {     // @arg Object - { timeout:UINT32 }
//{@dev
    if (VERIFY) {
        $valid($type(url,             "URLString"),     M3U8_load, "url");
        $valid($type(readyCallback,   "Function"),      M3U8_load, "readyCallback");
        $valid($type(errorCallback,   "Function|omit"), M3U8_load, "errorCallback");
        $valid($type(options,         "Object|omit"),   M3U8_load, "options");
        if (options) {
            $valid($keys(options,     "timeout"),       M3U8_load, "options");
        }
    }
//}@dev

    FileLoader["loadString"](url, readyCallback, errorCallback, options);
}

function M3U8_trim(playlist,  // @arg MediaPlaylistObject
                   options) { // @arg Object = null - { startTime, maxLength }
                              // @options.startTime UINT32 = 0
                              // @options.maxLength UINT8 = 0
                              // @ret MediaPlaylistObject
    options = options || {};
    return _trimMediaSegments(playlist, options["startTime"] || 0, options["maxLength"] || 0);
}

function M3U8_parse(m3u8,  // @arg M3U8FormatString - M3U8 format string
                    url) { // @arg PlaylistURLString = ""
                           // @ret MasterPlaylistObject|MediaPlaylistObject|null
//{@dev
    if (VERIFY) {
        $valid($type(m3u8, "String"),         M3U8_parse, "m3u8");
        $valid($type(url,  "URLString|omit"), M3U8_parse, "url");
    }
//}@dev

    url = url || "";

    var isMasterPlaylist = m3u8.indexOf("#EXT-X-STREAM-INF") >= 0;
    var lines = m3u8.trim().replace(/(\r\n|\r|\n)+/g, "\n").split("\n"); // line break normalize

    if (lines[0].trim() === "#EXTM3U") {
        return isMasterPlaylist ? _parseMasterPlaylist(lines, url)  // { url, type, version, streams }
                                : _parseMediaPlaylist(lines,  url); // { url, type, version, mediaSegments, ... }
    }
    return null; // invalid playlist
}

function _parseMasterPlaylist(lines, // @arg LineStringArray - ["#EXTM3U", "#EXT-X-VERSION:3", ...]
                              url) { // @arg MasterPlaylistURLString
                                     // @ret MasterPlaylistObject
    var masterPlaylistObject = {
            "url":      url,      // MasterPlaylistURL
            "type":     "MASTER", // MasterPlaylist type. "MASTER"
            "version":  0,        // #EXT-X-VERSION:<number>
            "streams":  [],       // MasterStreamObjectArray: [{ url, info, codecs, bandwidth, resolution, video, audio }, ...]
        };
    var itemInfo = null;

    for (var i = 0, iz = lines.length; i < iz; ++i) {
        var line = lines[i].trim();

        if (line) {
            if (/^#EXT/.test(line)) { // The Tag-line (^#EXT...)
                var record = line.split(":"); // "key:value" -> [key, value]
                var key    = record[0];
                var value  = record[1];

                switch (key) {
                case "#EXT-X-VERSION":    masterPlaylistObject["version"] = parseFloat(value); break;
                case "#EXT-X-STREAM-INF": itemInfo = _parseMasterStreamInfo(value);
                }
            } else if (/^#/.test(line)) { // The Comment-line (^#...)
                // skip
            } else if (itemInfo) {
                var codecs = _parseCodec(itemInfo["CODECS"] || "");

                masterPlaylistObject["streams"].push({
                    "url":          _toAbsoluteURL(line, url),
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
                itemInfo = null; // reset
            }
        }
    }
    return masterPlaylistObject;
}

function _parseMediaPlaylist(lines, // @arg LineStringArray - ["#EXTM3U", "#EXT-X-VERSION:3", ...]
                             url) { // @arg MediaPlaylistURLString
                                    // @ret MediaPlaylistObject
    var mediaPlaylistObject = {
            "url":            url,    // MediaPlaylistURL
            "type":           "LIVE", // MediaPlaylist type. "VOD" or "LIVE"
            "version":        0,      // #EXT-X-VERSION:<number>
            "combined":       false,  // #EXT-X-COMBINED:<YES OR NO>
            "allowCache":     false,  // #EXT-X-ALLOW-CACHE:<YES OR NO>
            "mediaSequence":  0,      // #EXT-X-MEDIA-SEQUENCE:<number>
            "mediaSegments":  [],     // MediaSegmentObjectArray [{ tsID, tsURL, tsDuration, tsRange, tsTitle }, ...]
            "targetDuration": 0,      // #EXT-X-TARGETDURATION:<number> (msec value)
            "totalDurations": 0,      // sum of the segment durations (VOD only) UINT32 (msec value)
        };
    var tsTitle    = "";
    var tsDuration = 0; // msec
    var totalDurations = 0; // msec

    for (var i = 0, iz = lines.length; i < iz; ++i) {
        var line = lines[i].trim();
        if (line) {
            if (/^#EXT/.test(line)) { // The Tag-line (^#EXT...)
                var record = line.split(":"); // "key:value" -> [key, value]
                var key    = record[0];
                var value  = record[1];

                switch (key) {
                case "#EXT-X-VERSION":        mediaPlaylistObject["version"]        = parseFloat(value); break;
                case "#EXT-X-ENDLIST":        mediaPlaylistObject["type"]           = "VOD";             break;
                case "#EXT-X-COMBINED":       mediaPlaylistObject["combined"]       = value === "YES";   break;
                case "#EXT-X-ALLOW-CACHE":    mediaPlaylistObject["allowCache"]     = value === "YES";   break;
                case "#EXT-X-TARGETDURATION": mediaPlaylistObject["targetDuration"] = (parseFloat(value) * 1000) | 0; break; // sec * 1000 -> msec
                case "#EXT-X-MEDIA-SEQUENCE": mediaPlaylistObject["mediaSequence"]  = parseInt(value); break;
                case "#EXT-X-DISCONTINUITY":  break; // TODO:
                case "#EXTINF":               tsDuration = (parseFloat(value) * 1000) | 0;
                                              tsTitle    = value.split(",").slice(1).join(","); // "duration,title..."
                }
            } else if (/^#/.test(line)) { // The Comment-line (^#...)
                // skip
            } else if (tsDuration) {
                mediaPlaylistObject["mediaSegments"].push({
                    "tsID":         mediaPlaylistObject["mediaSequence"] + mediaPlaylistObject["mediaSegments"].length,
                    "tsURL":        _toAbsoluteURL(line, url),
                    "tsDuration":   tsDuration || 0,
                    "tsTitle":      tsTitle    || "",
                    "tsRange": {
                        "startTime": totalDurations,
                        "endTime":   totalDurations + tsDuration
                    },
                });
                totalDurations += tsDuration;
                tsDuration      = 0;  // reset
                tsTitle         = ""; // reset
            }
        }
    }
    if (mediaPlaylistObject["type"] === "VOD") {
        mediaPlaylistObject["totalDurations"] = totalDurations;
    }
    return mediaPlaylistObject;
}

function _parseMasterStreamInfo(source) { // @arg String - 'BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.2",RESOLUTION=432x768'
                                          // @ret Object - { BANDWIDTH: "710852", CODECS: "avc1.66.30,mp4a.40.2", RESOLUTION: "432x768", info: "BANDWIDTH=710852..." }
                                          // @desc parse "key=value,..." -> { key: value, ... }
    var result  = { "info": source };
    var inQuote = false; // in "..."
    var inKey   = true;  // in key=value
    var key     = "";
    var value   = "";

    for (var i = 0, iz = source.length; i < iz; ++i) {
        var tokenEnd = (i === iz - 1) ? true : false;
        var c = source[i];

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

function M3U8_build(playlist) { // @ret MasterPlaylistObject|MediaPlaylistObject
                                // @ret M3U8FormatString
//{@dev
    if (VERIFY) {
        $valid($type(playlist, "Object"), M3U8_build, "playlist");
        if (playlist.type === "MASTER") {
            $valid($type(playlist.version,               "UINT8"),                   M3U8_build, "playlist.version");
            $valid($type(playlist.streams,               "MasterStreamObjectArray"), M3U8_build, "playlist.streams");
            $valid($type(playlist.streams[0].url,        "URLString"),               M3U8_build, "playlist.streams.url");
            $valid($type(playlist.streams[0].codecs,     "String"),                  M3U8_build, "playlist.streams.codecs");
            $valid($type(playlist.streams[0].bandwidth,  "String"),                  M3U8_build, "playlist.streams.bandwidth");
            $valid($type(playlist.streams[0].resolution, "String"),                  M3U8_build, "playlist.streams.resolution");
        } else if (playlist.type === "VOD" ||
                   playlist.type === "LIVE") {
            $valid($type(playlist.version,                     "UINT8"),                   M3U8_build, "playlist.version");
            $valid($type(playlist.mediaSegments,               "MediaSegmentObjectArray"), M3U8_build, "playlist.mediaSegments");
            $valid($type(playlist.mediaSegments[0].tsURL,      "URLString"),               M3U8_build, "playlist.mediaSegments.tsURL");
            $valid($type(playlist.mediaSegments[0].tsDuration, "UINT32"),                  M3U8_build, "playlist.mediaSegments.tsDuration");
        } else {
            $valid(false, M3U8_build, "Unknown Type: " + playlist.type);
        }
    }
//}@dev

    var lines = ["#EXTM3U"];
    var isMasterPlaylist = playlist["type"] === "MASTER";

    if (playlist["version"])        { lines.push("#EXT-X-VERSION:"        +  playlist["version"]);  }
    if (playlist["allowCache"])     { lines.push("#EXT-X-ALLOW-CACHE:"    + (playlist["allowCache"] ? "YES" : "NO")); }
    if (playlist["targetDuration"]) { lines.push("#EXT-X-TARGETDURATION:" + (playlist["targetDuration"] / 1000).toFixed(0)); }
    if (playlist["mediaSequence"])  { lines.push("#EXT-X-MEDIA-SEQUENCE:" +  playlist["mediaSequence"]); }

    var list = playlist["streams"] || playlist["mediaSegments"];

    for (var i = 0, iz = list.length; i < iz; ++i) {
        var buffer = [];
        var p = list[i];
        if (isMasterPlaylist) {
            if (p["bandwidth"])  { buffer.push("BANDWIDTH="  + p["bandwidth"]);      }
            if (p["codecs"])     { buffer.push("CODECS="     + _quote(p["codecs"])); }
            if (p["resolution"]) { buffer.push("RESOLUTION=" + p["resolution"]);     }
            lines.push("#EXT-X-STREAM-INF:" + buffer.join(","));
            lines.push(p["url"]);
        } else {
            if (p["tsDuration"]) { buffer.push(p["tsDuration"] / 1000); }
            if (p["tsTitle"])    { buffer.push(p["tsTitle"]);    }
            lines.push("#EXTINF:" + buffer.join(","));
            lines.push(p["tsURL"]);
        }
    }
    if (playlist["type"] === "VOD") { lines.push("#EXT-X-ENDLIST"); }
    return lines.join("\n");
}

function _quote(str) {
    return '"' + str + '"';
}

function _parseCodec(str) { // @arg CodecString - eg: "avc1.4D401E, mp4a.40.2"
                            // @ret CodecObject - { video: { codec, profile, level }, audio: { codec, profile, objectType } }
    var video = {
            codec:      "", // "AVC"
            profile:    "", // "Base", "Main", "High"
            level:      "", // "3.0", "4.1"
        };
    var audio = {
            codec:      "", // "AAC", "MP3"
            profile:    "", // "AAC-LC", "HE-AAC", "HE-AAC v2", "MP3", ""
            objectType: 0,  // 2, 5, 29, 34, ...
        };

    var codecArray = str.split(",");

    for (var i = 0, iz = codecArray.length; i < iz; ++i) {
        var codecs = codecArray[i].trim(); // "avc1.42c01e"

        if ( /^avc1/.test(codecs) ) {
            video.codec      = "AVC";
            video.profile    = H264Profile["getProfile"](codecs);  // "Base", "Main", "High", ""
            video.level      = H264Profile["getLevel"](codecs);    // "3.0", "4.1"
        } else if ( /^mp4a/.test(codecs) ) {
            audio.codec      = "AAC";
            audio.profile    = AACProfile["getProfile"](codecs);   // "AAC-LC", "HE-AAC", "HE-AAC v2", "MP3", ""
            audio.objectType = AACProfile["getAudioObjectType"](codecs); // 2, 5, 29, 34

            if (audio.profile === "MP3") {
                audio.codec = "MP3";
            }
        }
    }
    return { video: video, audio: audio };
}

function _toAbsoluteURL(url, baseURL) {
    if (!baseURL || URI["isAbsolute"](url)) {
        return url;
    }
    return URI["resolve"]( URI["getBaseURL"](baseURL) + url );
}

function _trimMediaSegments(playlist,                // @arg MediaPlaylistObject - { url, type, version, allowCache, mediaSequence, mediaSegments, targetDuration, totalDurations }
                            liveStartTime,           // @arg UINT32 = 0
                            liveFragmentMaxLength) { // @arg UINT8 = 0 - 0 is no limit
    var mediaSegments  = playlist["mediaSegments"];
    var mediaSegment   = null; // MediaSegmentObject - { tsID, tsURL, tsDuration, tsRange, tsTitle }
    var tsRange        = null; // Object - { startTime: UINT32, endTime: UINT32 }
    var startTime      = 0;    // UINT32
    var endTime        = 0;    // UINT32

    // skip media segments
    var i = 0, iz = mediaSegments.length, found = false;
    for (; i < iz; ++i) {
        mediaSegment = mediaSegments[i];        // MediaSegmentObject - { tsID, tsURL, tsDuration, tsRange, tsTitle }
        tsRange      = mediaSegment["tsRange"]; // Object - { startTime: UINT32, endTime: UINT32 }
        startTime    = tsRange["startTime"];    // UINT32
        endTime      = tsRange["endTime"];      // UINT32
        if (startTime <= liveStartTime && liveStartTime <= endTime) { // startTime <= liveStartTime <= endTime -> in range
            found = true;
            break;
        }
    }
    if (!found) {
        return playlist;
    }

    var newPlaylist = JSON.parse(JSON.stringify(playlist));
    var remain = liveFragmentMaxLength === 0 ? iz + 1 // 0 -> no limit
                                             : liveFragmentMaxLength;

    newPlaylist["mediaSegments"].length = 0; // clear media segments

    for (; i < iz; ++i) {
        newPlaylist["mediaSegments"].push(mediaSegments[i]);
        if (--remain <= 0) {
            break;
        }
    }
    return newPlaylist;
}

return M3U8; // return entity

});

