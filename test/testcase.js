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
        testM3U8_parseMasterPlaylist_AAC_LC,
        testM3U8_parseMasterPlaylist_HE_AAC,
        testM3U8_parseMasterPlaylist_HE_AAC_v2,
        testM3U8_parseMasterPlaylist_MP3,
        testM3U8_parseIndexPlaylist,
        testM3U8_buildMasterPlaylist,
        testM3U8_buildIndexPlaylist,
        testM3U8_VODFragment,
    ]);

// --- test cases ------------------------------------------
function testM3U8_parseMasterPlaylist_AAC_LC(test, pass, miss) {

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
            stream0.audio.objectType === 2              &&
            stream0.resolution       === "432x768") {

            test.done(pass());
            return;
        }
    }
    test.done(miss());
}

function testM3U8_parseMasterPlaylist_HE_AAC(test, pass, miss) {

    var source = '\n\
#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-STREAM-INF:BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.5",RESOLUTION=432x768\n\
chunklist_w1076224352.m3u8\n\
';

    var obj = M3U8.parse(source);

    console.dir(obj);

    var stream0 = obj["stream"][0];

    if (obj["version"] === 3 && obj["type"] === "MASTER") {
        if (stream0.bandwidth        === "710852" &&
            stream0.info             === 'BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.5",RESOLUTION=432x768' &&
            stream0.codecs           === "avc1.66.30,mp4a.40.5" &&
            stream0.video.codec      === "AVC"          &&
            stream0.video.profile    === "Base"         &&
            stream0.video.level      === "3.0"          &&
            stream0.audio.codec      === "AAC"          &&
            stream0.audio.profile    === "HE-AAC"       &&
            stream0.audio.objectType === 5              &&
            stream0.resolution       === "432x768") {

            test.done(pass());
            return;
        }
    }
    test.done(miss());
}

function testM3U8_parseMasterPlaylist_HE_AAC_v2(test, pass, miss) {

    var source = '\n\
#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-STREAM-INF:BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.29",RESOLUTION=432x768\n\
chunklist_w1076224352.m3u8\n\
';

    var obj = M3U8.parse(source);

    console.dir(obj);

    var stream0 = obj["stream"][0];

    if (obj["version"] === 3 && obj["type"] === "MASTER") {
        if (stream0.bandwidth        === "710852" &&
            stream0.info             === 'BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.29",RESOLUTION=432x768' &&
            stream0.codecs           === "avc1.66.30,mp4a.40.29" &&
            stream0.video.codec      === "AVC"          &&
            stream0.video.profile    === "Base"         &&
            stream0.video.level      === "3.0"          &&
            stream0.audio.codec      === "AAC"          &&
            stream0.audio.profile    === "HE-AAC v2"    &&
            stream0.audio.objectType === 29             &&
            stream0.resolution       === "432x768") {

            test.done(pass());
            return;
        }
    }
    test.done(miss());
}

function testM3U8_parseMasterPlaylist_MP3(test, pass, miss) {

    var source = '\n\
#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-STREAM-INF:BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.34",RESOLUTION=432x768\n\
chunklist_w1076224352.m3u8\n\
';

    var obj = M3U8.parse(source);

    console.dir(obj);

    var stream0 = obj["stream"][0];

    if (obj["version"] === 3 && obj["type"] === "MASTER") {
        if (stream0.bandwidth        === "710852" &&
            stream0.info             === 'BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.34",RESOLUTION=432x768' &&
            stream0.codecs           === "avc1.66.30,mp4a.40.34" &&
            stream0.video.codec      === "AVC"          &&
            stream0.video.profile    === "Base"         &&
            stream0.video.level      === "3.0"          &&
            stream0.audio.codec      === "MP3"          &&
            stream0.audio.profile    === "MP3"          &&
            stream0.audio.objectType === 34             &&
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
            if (obj["targetDuration"] === 2000) {
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

function testM3U8_VODFragment(test, pass, miss) {
    var source = '#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-MEDIA-SEQUENCE:0\n\
#EXT-X-ALLOW-CACHE:NO\n\
#EXT-X-TARGETDURATION:8\n\
#EXTINF:6.679778,\n\
a000.ts\n\
#EXTINF:5.000000,\n\
a001.ts\n\
#EXTINF:4.066667,\n\
a002.ts\n\
#EXTINF:4.366667,\n\
a003.ts\n\
#EXTINF:5.033333,\n\
a004.ts\n\
#EXTINF:7.833333,\n\
a005.ts\n\
#EXTINF:3.266667,\n\
a006.ts\n\
#EXTINF:6.333333,\n\
a007.ts\n\
#EXTINF:5.000000,\n\
a008.ts\n\
#EXTINF:1.666667,\n\
a009.ts\n\
#EXT-X-ENDLIST';

    var indexPlaylistObject = M3U8.parse(source);
    var stream = indexPlaylistObject.stream;

    if (stream.length === 10) {
        if (stream[9].fragment[0] === 47576 &&
            stream[9].fragment[1] === 49242) {
            test.done(pass());
            return;
        }
    }
    test.done(miss());
}

return test.run();

})(GLOBAL);

