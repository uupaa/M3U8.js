var ModuleTestM3U8 = (function(global) {

global["BENCHMARK"] = false;

var test = new Test("M3U8", {
        disable:    false, // disable all tests.
        browser:    true,  // enable browser test.
        worker:     true,  // enable worker test.
        node:       true,  // enable node test.
        nw:         true,  // enable nw.js test.
        el:         true,  // enable electron (render process) test.
        button:     true,  // show button.
        both:       true,  // test the primary and secondary modules.
        ignoreError:false, // ignore error.
        callback:   function() {
        },
        errorback:  function(error) {
            console.error(error.message);
        }
    }).add([
        testM3U8_parseMasterPlaylist,
        testM3U8_parseIndexPlaylist,
        testM3U8_buildMasterPlaylist,
        testM3U8_buildIndexPlaylist,
        testM3U8_filterMovieHead,
        testM3U8_filterLiveHead,
        testM3U8_filterMovieSequenceIsNotZero,
        testM3U8_filterLiveSequenceIsNotZero,
        testM3U8_filterMovieSequenceIsNotZeroWithIndex,
        testM3U8_filterLiveSequenceIsNotZeroWithIndex,
    ]);

// --- test cases ------------------------------------------
function testM3U8_parseMasterPlaylist(test, pass, miss) {

    var source = '\n\
#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-STREAM-INF:BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.2",RESOLUTION=432x768\n\
chunklist_w1076224352.m3u8\n\
';

    var obj = M3U8.parse(source);

    console.dir(obj);

    var stream0 = obj["stream"][0];

    if (obj["version"] === 3 && obj["type"] === "MASTER") {
        if (stream0.bandwidth        === "710852" &&
            stream0.info             === 'BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.2",RESOLUTION=432x768' &&
            stream0.codecs           === "avc1.66.30,mp4a.40.2" &&
            stream0.video.codec      === "AVC"          &&
            stream0.video.profile    === "Base"         &&
            stream0.video.level      === "3.0"          &&
            stream0.audio.codec      === "AAC"          &&
            stream0.audio.profile    === "AAC-LC"       &&
            stream0.resolution       === "432x768") {

            test.done(pass());
            return;
        }
    }
    test.done(miss());
}

function testM3U8_parseIndexPlaylist(test, pass, miss) {

    var source = "\n\
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

    var obj = M3U8.parse(source);

    console.dir(obj);

    if (obj["version"] === 3 && obj["type"] === "LIVE") {
        if (obj["cache"] === false) {
            if (obj["duration"] === 2000) {
                if (obj["sequence"] === 1459) {
                    if (obj["stream"][0].duration === 858) {
                        if (obj["stream"][1].duration === 886) {
                            if (obj["stream"][2].duration === 835) {
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

function testM3U8_buildMasterPlaylist(test, pass, miss) {
    // MasterPlaylist -> parse -> build -> parse -> build -> restoration

    var source = '#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-STREAM-INF:BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.2",RESOLUTION=432x768\n\
chunklist_w1076224352.m3u8';

    var obj1 = M3U8.parse(source);
    var str1 = M3U8.build(obj1);
    var obj2 = M3U8.parse(str1);
    var str2 = M3U8.build(obj2);

    if (source === str2) {
        test.done(pass());
    } else {
        test.done(miss());
    }
}

function testM3U8_buildIndexPlaylist(test, pass, miss) {
    // IndexPlaylist -> parse -> build -> parse -> build -> restoration

    var source = '#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-ALLOW-CACHE:NO\n\
#EXT-X-TARGETDURATION:2\n\
#EXT-X-MEDIA-SEQUENCE:1459\n\
#EXTINF:0.858,\n\
media_w1360442349_1459.ts\n\
#EXTINF:0.886,\n\
media_w1360442349_1460.ts\n\
#EXTINF:0.835,\n\
media_w1360442349_1461.ts';

    var obj1 = M3U8.parse(source);
    var str1 = M3U8.build(obj1);
    var obj2 = M3U8.parse(str1);
    var str2 = M3U8.build(obj2);

    var result1 = JSON.stringify(obj1);
    var result2 = JSON.stringify(obj2);

    if (result1 === result2) {
        test.done(pass());
    } else {
        test.done(miss());
    }
}

function testM3U8_filterMovieHead(test, pass, miss) {

    var source = '#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-TARGETDURATION:2\n\
#EXT-X-MEDIA-SEQUENCE:0\n\
#EXTINF:2.000,\n\
a.ts\n\
#EXTINF:2.000,\n\
b.ts\n\
#EXTINF:2.000,\n\
c.ts\n\
#EXTINF:2.000,\n\
d.ts\n\
#EXT-X-ENDLIST';

    var indexPlaylistObject = M3U8.parse(source);
    var stream = M3U8.filter(indexPlaylistObject)["stream"];

    if (indexPlaylistObject.type === "MOVIE" &&
        stream.length === 4 &&
        stream[0].index === 0 &&
        stream[1].index === 1 &&
        stream[2].index === 2 &&
        stream[3].index === 3) {
        if (stream[0].url === "a.ts" &&
            stream[1].url === "b.ts" &&
            stream[2].url === "c.ts" &&
            stream[3].url === "d.ts") {
            if (stream[0].duration === 2000 &&
                stream[1].duration === 2000 &&
                stream[2].duration === 2000 &&
                stream[3].duration === 2000) {
                test.done(pass());
                return;
            }
        }
    }
    test.done(miss());
}

function testM3U8_filterLiveHead(test, pass, miss) {

    var source = '#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-TARGETDURATION:2\n\
#EXT-X-MEDIA-SEQUENCE:0\n\
#EXTINF:2.000,\n\
a.ts\n\
#EXTINF:2.000,\n\
b.ts\n\
#EXTINF:2.000,\n\
c.ts\n\
#EXTINF:2.000,\n\
d.ts';

    var indexPlaylistObject = M3U8.parse(source);
    var stream = M3U8.filter(indexPlaylistObject)["stream"];

    if (indexPlaylistObject.type === "LIVE" &&
        stream.length === 2 &&
        stream[0].index === 2 &&
        stream[1].index === 3) {
        if (stream[0].url === "c.ts" &&
            stream[1].url === "d.ts") {
            if (stream[0].duration === 2000 &&
                stream[1].duration === 2000) {
                test.done(pass());
                return;
            }
        }
    }
    test.done(miss());
}

function testM3U8_filterMovieSequenceIsNotZero(test, pass, miss) {
    // #EXT-X-ENDLIST がある → movie
    // #EXT-X-MEDIA-SEQUENCE が 100 (0 以外)
    // movie を途中から再生している → このケースは通常だと考えづらいが stream に対して何もしない

    var source = '#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-TARGETDURATION:2\n\
#EXT-X-MEDIA-SEQUENCE:100\n\
#EXTINF:2.000,\n\
a.ts\n\
#EXTINF:2.000,\n\
b.ts\n\
#EXTINF:2.000,\n\
c.ts\n\
#EXTINF:2.000,\n\
d.ts\n\
#EXT-X-ENDLIST';

    var indexPlaylistObject = M3U8.parse(source);
    var stream = M3U8.filter(indexPlaylistObject)["stream"];

    if (indexPlaylistObject.type === "MOVIE" &&
        stream.length === 4 &&
        stream[0].index === 100 + 0 &&
        stream[1].index === 100 + 1 &&
        stream[2].index === 100 + 2 &&
        stream[3].index === 100 + 3) {
        if (stream[0].url === "a.ts" &&
            stream[1].url === "b.ts" &&
            stream[2].url === "c.ts" &&
            stream[3].url === "d.ts") {
            if (stream[0].duration === 2000 &&
                stream[1].duration === 2000 &&
                stream[2].duration === 2000 &&
                stream[3].duration === 2000) {
                test.done(pass());
                return;
            }
        }
    }
    test.done(miss());
}

function testM3U8_filterLiveSequenceIsNotZero(test, pass, miss) {
    // #EXT-X-ENDLIST がない → live
    // #EXT-X-MEDIA-SEQUENCE が 100 (0 以外)
    // live を途中から再生している → 遅延を最小化するため threshold(3000) を元に頭出しする → a.ts と b.ts がカットされ c.ts から再生する

    var source = '#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-TARGETDURATION:2\n\
#EXT-X-MEDIA-SEQUENCE:100\n\
#EXTINF:2.000,\n\
a.ts\n\
#EXTINF:2.000,\n\
b.ts\n\
#EXTINF:2.000,\n\
c.ts\n\
#EXTINF:2.000,\n\
d.ts';

    var indexPlaylistObject = M3U8.parse(source);
    var currentIndex = 0;
    var threshold = 3000;
    var stream = M3U8.filter(indexPlaylistObject, currentIndex, threshold)["stream"]; // a.ts と b.ts がカットされる

    if (indexPlaylistObject.type === "LIVE" &&
        stream.length === 2 &&
        stream[0].index === 100 + 2 &&
        stream[1].index === 100 + 3) {
        if (stream[0].url === "c.ts" &&
            stream[1].url === "d.ts") {
            if (stream[0].duration === 2000 &&
                stream[1].duration === 2000) {
                test.done(pass());
                return;
            }
        }
    }
    test.done(miss());
}


function testM3U8_filterMovieSequenceIsNotZeroWithIndex(test, pass, miss) {
    // #EXT-X-ENDLIST がある → movie
    // #EXT-X-MEDIA-SEQUENCE が 100 (0 以外)
    // movie を途中から再生している + index(102) が指定されている → このケースは通常だと考えづらいが stream に対して何もしない

    var source = '#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-TARGETDURATION:2\n\
#EXT-X-MEDIA-SEQUENCE:100\n\
#EXTINF:2.000,\n\
a.ts\n\
#EXTINF:2.000,\n\
b.ts\n\
#EXTINF:2.000,\n\
c.ts\n\
#EXTINF:2.000,\n\
d.ts\n\
#EXT-X-ENDLIST';

    var indexPlaylistObject = M3U8.parse(source);
    var threshold = 3000;
    var currentIndex = 102;
    var stream = M3U8.filter(indexPlaylistObject, currentIndex, threshold)["stream"];

    if (indexPlaylistObject.type === "MOVIE" &&
        stream.length === 4 &&
        stream[0].index === 100 + 0 &&
        stream[1].index === 100 + 1 &&
        stream[2].index === 100 + 2 &&
        stream[3].index === 100 + 3) {
        if (stream[0].url === "a.ts" &&
            stream[1].url === "b.ts" &&
            stream[2].url === "c.ts" &&
            stream[3].url === "d.ts") {
            if (stream[0].duration === 2000 &&
                stream[1].duration === 2000 &&
                stream[2].duration === 2000 &&
                stream[3].duration === 2000) {
                test.done(pass());
                return;
            }
        }
    }
    test.done(miss());
}

function testM3U8_filterLiveSequenceIsNotZeroWithIndex(test, pass, miss) {
    // #EXT-X-ENDLIST がない → live
    // #EXT-X-MEDIA-SEQUENCE が 100 (0 以外)
    // live を途中から再生している + 現在102まで再生済み(currentIndex = 101)
    //  → 遅延を最小化するため threshold(3000) を元に頭出しする
    //  → a.ts(index:100), b.ts(index:101), c.ts(index.102) がカットされ d.ts から再生する
    //     再生可能な ts の総量(duration) が threshold 以下になるが、この場合は妥当

    var source = '#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-TARGETDURATION:2\n\
#EXT-X-MEDIA-SEQUENCE:100\n\
#EXTINF:2.000,\n\
a.ts\n\
#EXTINF:2.000,\n\
b.ts\n\
#EXTINF:2.000,\n\
c.ts\n\
#EXTINF:2.000,\n\
d.ts';

    var indexPlaylistObject = M3U8.parse(source);
    var threshold = 3000;
    var currentIndex = 102;
    var stream = M3U8.filter(indexPlaylistObject, currentIndex, threshold)["stream"]; // a.ts, b.ts, c.ts がカットされる

    if (indexPlaylistObject.type === "LIVE" &&
        stream.length === 1 &&
        stream[0].index === 100 + 3) {
        if (stream[0].url === "d.ts") {
            if (stream[0].duration === 2000) {
                test.done(pass());
                return;
            }
        }
    }
    test.done(miss());
}


return test.run();

})(GLOBAL);

