(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("M3U", function moduleClosure(global) {
"use strict";

// --- dependency modules ----------------------------------
// --- define / local variables ----------------------------
// --- class / interfaces ----------------------------------
var M3U = {
    "VERBOSE":      false,
    "parse":        M3U_parse,  // M3U.parse(str:M3UFormatString):M3UObject
    "build":        M3U_build,  // M3U.build(obj:M3UObject):M3UFormatString
    "repository":   "https://github.com/uupaa/M3U.js",
};

// --- implements ------------------------------------------
function M3U_parse(str) { // @arg M3UFormatString - M3U/M3U8 format string
                          // @ret M3UObject - { VERSION, MASTER, END, CACHE, DURATION, SEQUENCE, ITEMS } or { VERSION, MASTER, END, CACHE, DURATION, SEQUENCE, ITEMS } or null
//{@dev
    if (!global["BENCHMARK"]) {
        $valid($type(str, "String"), M3U_parse, "str");
    }
//}@dev

    var isMasterFile = str.indexOf("#EXT-X-STREAM-INF") >= 0;
    var lines = str.trim().replace(/(\r\n|\r|\n)+/g, "\n").split("\n");

    if (lines[0].trim() === "#EXTM3U") {
        return isMasterFile ? _parseMasterFile(lines)
                            : _parseIndexFile(lines);
    }
    return null;
}

function _parseMasterFile(lines) {
    var result = {
            "VERSION":  0,            // has #EXT-X-VERSION
            "MASTER":   true,
            "LINK":     [],           // #EXTINF and URL values [{ URL, CODECS, BANDWIDTH, RESOLUTION }, ...]
        };
    var info = {};

    for (var i = 0, iz = lines.length; i < iz; ++i) {
        var line = lines[i].trim();
        if (line) {
            if (line[0] === "#") {
                var token = line.split(":"); // "key:valye" -> [key, value]
                var key   = token[0];
                var value = token[1];

                switch (key) {
                case "#EXT-X-VERSION":      result["VERSION"] = parseFloat(value); break;
                case "#EXT-X-STREAM-INF":   info = _parseStreamInfo(value);
                }
            } else {
                result["LINK"].push({
                    "URL":          line,
                    "CODECS":       info["CODECS"]     || "",
                    "BANDWIDTH":    info["BANDWIDTH"]  || "",
                    "RESOLUTION":   info["RESOLUTION"] || ""
                });
            }
        }
    }
    return result;
}

function _parseIndexFile(lines) {
    var result = {
            "VERSION":  0,            // has #EXT-X-VERSION
            "MASTER":   false,
            "END":      false,        // has #EXT-X-ENDLIST
            "CACHE":    false,        // has #EXT-X-ALLOW-CACHE
            "DURATION": 0,            // #EXT-X-TARGETDURATION value
            "SEQUENCE": 0,            // #EXT-X-MEDIA-SEQUENCE value
            "LINK":     [],           // #EXTINF and URL values [{ URL, DURATION, TITLE, BANDWIDTH, CODECS, RESOLUTION }, ...]
        };
    var itemTitle = "";
    var itemDuration = "";

    for (var i = 0, iz = lines.length; i < iz; ++i) {
        var line = lines[i].trim();
        if (line) {
            if (line[0] === "#") {
                var token = line.split(":"); // "key:valye" -> [key, value]
                var key   = token[0];
                var value = token[1];

                switch (key) {
                case "#EXT-X-VERSION":        result["VERSION"]  = parseFloat(value); break;
                case "#EXT-X-ENDLIST":        result["END"]      = true; break;
                case "#EXT-X-ALLOW-CACHE":    result["CACHE"]    = value === "YES";   break;
                case "#EXT-X-TARGETDURATION": result["DURATION"] = parseFloat(value); break;
                case "#EXT-X-MEDIA-SEQUENCE": result["SEQUENCE"] = parseFloat(value); break;
                case "#EXTINF":               itemDuration = parseFloat(value) + "";
                                              itemTitle    = value.split(",").slice(1).join(","); // "duration,title..."
                }
            } else {
                result["LINK"].push({
                    "URL":          line,
                    "DURATION":     itemDuration || "",
                    "TITLE":        itemTitle    || ""
                });
            }
        }
    }
    return result;
}

function _parseStreamInfo(str) { // @arg String - 'BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.2",RESOLUTION=432x768'
                                 // @ret Object - { BANDWIDTH: "710852", CODECS: "avc1.66.30,mp4a.40.2", RESOLUTION: "432x768" }
    var result = {};
    var inQuote = false;
    var inKey = true;
    var key   = "";
    var value = "";

    for (var i = 0, iz = str.length; i < iz; ++i) {
        var end = (i === iz - 1) ? true : false;
        var c = str[i];

        if (inQuote) {
            switch (c) {
            case '"': inQuote = false; break;
            default:  if (inKey) { key += c;      } else { value += c; }
            }
        } else {
            switch (c) {
            case '"': inQuote = true; break;
            case '=': if (inKey) { inKey = false; } else { value += c; } break;
            case ',': if (inKey) { key += c;      } else { end = true; } break;
            default:  if (inKey) { key += c;      } else { value += c; }
            }
        }
        if (end) {
            result[key] = value;
            inKey = true;
            key   = "";
            value = "";
        }
    }
    return result;
}

function M3U_build(obj) { // @arg M3UObject - { VERSION, END, CACHE, DURATION, SEQUENCE, LINK }
                          // @ret M3UFormatString
    var lines = ["#EXTM3U"];

    if (obj["VERSION"])  { lines.push("#EXT-X-VERSION:" + obj["VERSION"]); }
    if (obj["END"])      { lines.push("#EXT-X-ENDLIST"); }
    if (obj["CACHE"])    { lines.push("#EXT-X-ALLOW-CACHE:" + (obj["CACHE"] ? "YES" : "NO")); }
    if (obj["DURATION"]) { lines.push("#EXT-X-TARGETDURATION:" + obj["DURATION"]); }
    if (obj["SEQUENCE"]) { lines.push("#EXT-X-MEDIA-SEQUENCE:" + obj["SEQUENCE"]); }

    var link = obj["LINK"];

    for (var i = 0, iz = link.length; i < iz; ++i) {
        var buffer = [];
        var p = link[i];
        if (obj["MASTER"]) {
            if (p["BANDWIDTH"])  { buffer.push("BANDWIDTH="  + p["BANDWIDTH"]);  }
            if (p["CODECS"])     { buffer.push("CODECS=" + _quote(p["CODECS"])); }
            if (p["RESOLUTION"]) { buffer.push("RESOLUTION=" + p["RESOLUTION"]); }
            lines.push("#EXT-X-STREAM-INF:" + buffer.join(","));
            lines.push(p["URL"]);
        } else {
            if (p["DURATION"])   { buffer.push(p["DURATION"]); }
            if (p["TITLE"])      { buffer.push(p["TITLE"]);    }
            lines.push("#EXTINF:" + buffer.join(","));
            lines.push(p["URL"]);
        }
    }
    return lines.join("\n");
}

function _quote(str) {
    return '"' + str + '"';
}

return M3U; // return entity

});

