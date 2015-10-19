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
    "parse":        M3U_parse,  // M3U.parse(txt:String):M3UDataObject
    "repository":   "https://github.com/uupaa/M3U.js",
};

// --- implements ------------------------------------------
function M3U_parse(txtFile) { // @arg String - M3U8 txt file
                              // @ret M3UDataObject - { ... }
//{@dev
    if (!global["BENCHMARK"]) {
        $valid($type(txtFile, "String"), M3U_parse, "txtFile");
    }
//}@dev

    var m3u = {
            "EXT-X-VERSION": 0,
            "EXT-X-ALLOW-CACHE": false,
            "EXT-X-TARGETDURATION": 0,
            "EXT-X-MEDIA-SEQUENCE": 0,
            "EXTINF": [], // { url, duration }
            "EXT-X-ENDLIST": false,
        };

    var lines = txtFile.replace(/\r\n/g, "\n").split("\n");
    var duration = 0;

    for (var i = 0, iz = lines.length; i < iz; ++i) {
        var line = lines[i];
        if (line) {
            if (line[0] === "#") {
                var token = line.split(":"); // "key:valye" -> [key, value]
                var key   = token[0].slice(1);
                var value = token[1];
                switch (key) {
                case "EXTM3U": break;
                case "EXT-X-VERSION":        m3u[key] = parseFloat(value); break;
                case "EXT-X-ALLOW-CACHE":    m3u[key] = value; break;
                case "EXT-X-MEDIA-SEQUENCE": m3u[key] = parseFloat(value); break;
                case "EXT-X-TARGETDURATION": m3u[key] = parseFloat(value); break;
                case "EXTINF":               duration = parseFloat(value); break;
                case "EXT-X-ENDLIST":        m3u[key] = true; break;
                }
            } else {
                m3u["EXTINF"].push({ "url": line, "duration": duration });
            }
        }
    }
    return m3u;
}

return M3U; // return entity

});

