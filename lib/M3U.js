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
var VERIFY  = global["WebModule"]["verify"]  || false;
var VERBOSE = global["WebModule"]["verbose"] || false;

// --- class / interfaces ----------------------------------
var M3U = {
    "parse":        M3U_parse,  // M3U.parse(str:M3UFormatString):M3UMasterObject|M3UIndexObject|null
    "build":        M3U_build,  // M3U.build(obj:M3UMasterObject|M3UIndexObject):M3UFormatString
    "repository":   "https://github.com/uupaa/M3U.js",
};

// --- implements ------------------------------------------
function M3U_parse(str) { // @arg M3UFormatString - M3U/M3U8 format string
                          // @ret M3UMasterObject|M3UIndexObject|null - M3UMasterObject = { VERSION, MASTER, LINK }
                          //                                            M3UIndexObject  = { VERSION, INDEX, END, CACHE, DURATION, SEQUENCE, LINK }
//{@dev
    if (VERIFY) {
        $valid($type(str, "String"), M3U_parse, "str");
    }
//}@dev

    var isMasterObject = str.indexOf("#EXT-X-STREAM-INF") >= 0;
    var lines = str.trim().replace(/(\r\n|\r|\n)+/g, "\n").split("\n"); // line break normalize

    if (lines[0].trim() === "#EXTM3U") {
        return isMasterObject ? _parseMasterFile(lines) // { VERSION, MASTER, LINK:[] }
                              : _parseIndexFile(lines); // { VERSION, INDEX, END, CACHE, DURATION, SEQUENCE, LINK:[] }
    }
    return null;
}

function _parseMasterFile(lines) { // @arg LineStringArray - ["#EXTM3U", "#EXT-X-VERSION:3", ...]
                                   // @ret M3UMasterObject
    var masterObject = {
            "VERSION":  0,      // #EXT-X-VERSION value
            "MASTER":   true,   // has #EXT-X-STREAM-INF
            "LINK":     [],     // #EXTINF and URL values [{ URL, CODECS, BANDWIDTH, RESOLUTION }, ...]
        };
    var info = {};

    for (var i = 0, iz = lines.length; i < iz; ++i) {
        var line = lines[i].trim();
        if (line) {
            if (line[0] === "#") { // is comment line
                var record = line.split(":"); // "key:value" -> [key, value]
                var key    = record[0];
                var value  = record[1];

                switch (key) {
                case "#EXT-X-VERSION":      masterObject["VERSION"] = parseFloat(value); break;
                case "#EXT-X-STREAM-INF":   info = _parseStreamInfo(value);
                }
            } else {
                masterObject["LINK"].push({
                    "URL":          line,
                    "CODECS":       info["CODECS"]     || "",
                    "BANDWIDTH":    info["BANDWIDTH"]  || "",
                    "RESOLUTION":   info["RESOLUTION"] || ""
                });
            }
        }
    }
    return masterObject;
}

function _parseIndexFile(lines) { // @arg LineStringArray - ["#EXTM3U", "#EXT-X-VERSION:3", ...]
                                  // @ret M3UIndexObject
    var indexObject = {
            "VERSION":  0,      // #EXT-X-VERSION value
            "INDEX":    true,
            "END":      false,  // has #EXT-X-ENDLIST
            "CACHE":    false,  // has #EXT-X-ALLOW-CACHE
            "DURATION": 0,      // #EXT-X-TARGETDURATION value
            "SEQUENCE": 0,      // #EXT-X-MEDIA-SEQUENCE value
            "LINK":     [],     // #EXTINF and URL values [{ URL, DURATION, TITLE, BANDWIDTH, CODECS, RESOLUTION }, ...]
        };
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
                case "#EXT-X-VERSION":        indexObject["VERSION"]  = parseFloat(value); break;
                case "#EXT-X-ENDLIST":        indexObject["END"]      = true; break;
                case "#EXT-X-ALLOW-CACHE":    indexObject["CACHE"]    = value === "YES";   break;
                case "#EXT-X-TARGETDURATION": indexObject["DURATION"] = parseFloat(value); break;
                case "#EXT-X-MEDIA-SEQUENCE": indexObject["SEQUENCE"] = parseFloat(value); break;
                case "#EXTINF":               itemDuration = parseFloat(value) + "";
                                              itemTitle    = value.split(",").slice(1).join(","); // "duration,title..."
                }
            } else {
                indexObject["LINK"].push({
                    "URL":          line,
                    "DURATION":     itemDuration || "",
                    "TITLE":        itemTitle    || ""
                });
            }
        }
    }
    return indexObject;
}

function _parseStreamInfo(str) { // @arg String - 'BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.2",RESOLUTION=432x768'
                                 // @ret Object - { BANDWIDTH: "710852", CODECS: "avc1.66.30,mp4a.40.2", RESOLUTION: "432x768" }
                                 // @desc parse "key=value,..." -> { key: value, ... }
    var result = {};
    var inQuote = false; // in "..."
    var inKey = true;    // in key=value
    var key   = "";
    var value = "";

    for (var i = 0, iz = str.length; i < iz; ++i) {
        var tokenEnd = (i === iz - 1) ? true : false;
        var c = str[i];

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

function M3U_build(obj) { // @ret M3UMasterObject|M3UIndexObject - M3UMasterObject = { VERSION, MASTER, LINK:[{ URL, CODECS, BANDWIDTH, RESOLUTION }, ...] }
                          //                                       M3UIndexObject  = { VERSION, INDEX, END, CACHE, DURATION, SEQUENCE, LINK:[{ URL, DURATION, TITLE }, ...] }
                          // @ret M3UFormatString
//{@dev
    if (VERIFY) {
        $valid($type(obj, "Object"), M3U_build, "obj");
    }
//}@dev

    var lines = ["#EXTM3U"];
    var isMasterObject = !!obj["MASTER"];

    if (obj["VERSION"])  { lines.push("#EXT-X-VERSION:" + obj["VERSION"]); }
    if (obj["END"])      { lines.push("#EXT-X-ENDLIST"); }
    if (obj["CACHE"])    { lines.push("#EXT-X-ALLOW-CACHE:" + (obj["CACHE"] ? "YES" : "NO")); }
    if (obj["DURATION"]) { lines.push("#EXT-X-TARGETDURATION:" + obj["DURATION"]); }
    if (obj["SEQUENCE"]) { lines.push("#EXT-X-MEDIA-SEQUENCE:" + obj["SEQUENCE"]); }

    var link = obj["LINK"];

    for (var i = 0, iz = link.length; i < iz; ++i) {
        var buffer = [];
        var p = link[i];
        if (isMasterObject) {
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

