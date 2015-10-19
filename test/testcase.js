var ModuleTestM3U = (function(global) {

global["BENCHMARK"] = false;

var test = new Test("M3U", {
        disable:    false, // disable all tests.
        browser:    true,  // enable browser test.
        worker:     true,  // enable worker test.
        node:       true,  // enable node test.
        nw:         true,  // enable nw.js test.
        button:     true,  // show button.
        both:       true,  // test the primary and secondary modules.
        ignoreError:false, // ignore error.
        callback:   function() {
        },
        errorback:  function(error) {
        }
    }).add([
        testM3U_parse,
    ]);

if (IN_BROWSER || IN_NW) {
    test.add([
        // browser and node-webkit test
    ]);
} else if (IN_WORKER) {
    test.add([
        // worker test
    ]);
} else if (IN_NODE) {
    test.add([
        // node.js and io.js test
    ]);
}

// --- test cases ------------------------------------------
function testM3U_parse(test, pass, miss) {
    var str = "\n\
#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-ALLOW-CACHE:NO\n\
#EXT-X-TARGETDURATION:2\n\
#EXT-X-MEDIA-SEQUENCE:1459\n\
#EXTINF:0.858,\n\
media_w1360442349_1459.ts\n\
#EXTINF:0.886,\n\
media_w1360442349_1460.ts\n\
#EXTINF:0.835,\n\
media_w1360442349_1461.ts\n\
";

    var m3u = M3U.parse(str);

    console.dir(m3u);

    if (m3u["EXT-X-VERSION"] === 3) {
        if (m3u["EXT-X-ALLOW-CACHE"] === "NO") {
            if (m3u["EXT-X-TARGETDURATION"] === 2) {
                if (m3u["EXT-X-MEDIA-SEQUENCE"] === 1459) {
                    if (m3u["EXTINF"][0].duration === 0.858) {
                        if (m3u["EXTINF"][1].duration === 0.886) {
                            if (m3u["EXTINF"][2].duration === 0.835) {
                                test.done(pass());
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
    test.done(miss());
}

return test.run();

})(GLOBAL);

