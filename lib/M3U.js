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
    "parse":        M3U_parse,  // M3U.parse(str:String):JSONObject
    "build":        M3U_build,  // M3U.build(json:Object):String
    "repository":   "https://github.com/uupaa/M3U.js",
};

// --- implements ------------------------------------------
function M3U_parse(str) { // @arg String - M3U/M3U8 text
                          // @ret JSONObject - { ... }
//{@dev
    if (!global["BENCHMARK"]) {
        $valid($type(str, "String"), M3U_parse, "str");
    }
//}@dev
    var isExtended = str.indexOf("#EXTM3U") >= 0;
    var isMaster   = str.indexOf("#EXT-X-STREAM-INF") >= 0;

    var json = {
            "extended": isExtended,
            "master":   isMaster,   // true is master, false is index
            "version":  0,
            "end":      false,
            "cache":    false,
            "duration": 0,          // Max duration in this m3u list
            "sequence": 0,          // URL sequence number.
            "file":     [],         // { url, duration, title, bandwidth, codecs, resolution, programid }
        };

    var lines = str.trim().replace(/\r\n/g, "\n").split("\n");

    var duration = 0;
    var title = "";
    var info = {};
    for (var i = 0, iz = lines.length; i < iz; ++i) {
        var line = lines[i].trim();
        if (line) {
            if (line[0] === "#") {
                var token = line.split(":"); // "key:valye" -> [key, value]
                var key   = token[0];
                var value = token[1];

                switch (key) {
                case "#EXTM3U":               json["extended"] = true;break;
                case "#EXT-X-VERSION":        json["version"]  = parseFloat(value); break;
                case "#EXT-X-ALLOW-CACHE":    json["cache"]    = value === "YES";   break;
                case "#EXT-X-MEDIA-SEQUENCE": json["sequence"] = parseFloat(value); break;
                case "#EXT-X-TARGETDURATION": json["duration"] = parseFloat(value); break;
                case "#EXT-X-ENDLIST":        json["end"]      = true; break;
                case "#EXT-X-STREAM-INF":     _parseInfo(value, info = {}); break;
                case "#EXTINF":               duration = parseFloat(value);
                                              title    = value.split(",").slice(1).join(","); // "duration,title..."
                                              break;
                }
            } else {
                if (isMaster) {
                    json["file"].push({ "url": line, "bandwidth":  parseFloat(info["BANDWIDTH"]) || 0,
                                                     "codecs":     info["CODECS"]     || "",
                                                     "resolution": info["RESOLUTION"] || "" });
                } else {
                    json["file"].push({ "url": line, "duration":   duration,
                                                     "title":      title });
                }
            }
        }
    }
    return json;
}

function M3U_build(json) { // @arg Object - M3U/M3U8 object
                           // @ret String
    var lines = ["#EXTM3U"];

    if (json["version"])    { lines.push("#EXT-X-VERSION:" + json["version"]); }
    if (json["cache"])      { lines.push("#EXT-X-ALLOW-CACHE:" + (json["cache"] ? "YES" : "NO")); }
    if (json["sequence"])   { lines.push("#EXT-X-MEDIA-SEQUENCE:" + json["sequence"]); }
    if (json["duration"])   { lines.push("#EXT-X-TARGETDURATION:" + json["duration"]); }
    if (json["end"])        { lines.push("#EXT-X-ENDLIST"); }
    var file = json["file"];

    for (var i = 0, iz = file.length; i < iz; ++i) {
        var buffer = [];
        var f = file[i];
        if (json["master"]) {
            if (f["bandwidth"])  { buffer.push("BANDWIDTH="  + f["bandwidth"]);  }
            if (f["codecs"])     { buffer.push("CODECS="     + '"' + f["codecs"] + '"'); }
            if (f["resolution"]) { buffer.push("RESOLUTION=" + f["resolution"]); }
            lines.push("#EXT-X-STREAM-INF:" + buffer.join(","));
            lines.push(f["url"]);
        } else {
            if (f["duration"])   { buffer.push(f["duration"]); }
            if (f["title"])      { buffer.push(f["title"]);    }
            lines.push("#EXTINF:" + buffer.join(","));
            lines.push(f["url"]);
        }
    }
    return lines.join("\n");
}

function _parseInfo(value, result) {
    // source: 'BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.2",RESOLUTION=432x768'
    // result: ["BANDWIDTH", "710852", "CODECS", "avc1.66.30,mp4a.40.2", "RESOLUTION", "432x768"]

    var inQuote = false;
    var array = value.split(/[,\=]/).reduce(function(r, token) {
        if (!inQuote && /^"/.test(token)) {
            inQuote = true;
            r.push(token.slice(1));
        } else if (inQuote && /"$/.test(token)) {
            inQuote = false;
            r.push( [r.pop(), ",", token.slice(0, -1) ].join("") );
        } else {
            r.push(token);
        }
        return r;
    }, []);

    for (var i = 0, iz = array.length; i < iz; i += 2) {
        result[array[i]] = array[i + 1];
    }
}

return M3U; // return entity

});

