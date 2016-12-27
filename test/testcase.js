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
        testM3U8_parseMediaPlaylist_Live,
        testM3U8_buildMasterPlaylist,
        testM3U8_buildMediaPlaylist_Live,
        testM3U8_buildMediaPlaylist_VOD,
        testM3U8_tsRange_VOD,
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

    var s0 = obj["streams"][0];

    if (obj["version"] === 3 && obj["type"] === "MASTER") {
        if (s0.bandwidth        === "710852" &&
            s0.info             === 'BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.2",RESOLUTION=432x768' &&
            s0.codecs           === "avc1.66.30,mp4a.40.2" &&
            s0.video.codec      === "AVC"          &&
            s0.video.profile    === "Base"         &&
            s0.video.level      === "3.0"          &&
            s0.audio.codec      === "AAC"          &&
            s0.audio.profile    === "AAC-LC"       &&
            s0.audio.objectType === 2              &&
            s0.resolution       === "432x768") {

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

    var s0 = obj["streams"][0];

    if (obj["version"] === 3 && obj["type"] === "MASTER") {
        if (s0.bandwidth        === "710852" &&
            s0.info             === 'BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.5",RESOLUTION=432x768' &&
            s0.codecs           === "avc1.66.30,mp4a.40.5" &&
            s0.video.codec      === "AVC"          &&
            s0.video.profile    === "Base"         &&
            s0.video.level      === "3.0"          &&
            s0.audio.codec      === "AAC"          &&
            s0.audio.profile    === "HE-AAC"       &&
            s0.audio.objectType === 5              &&
            s0.resolution       === "432x768") {

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

    var s0 = obj["streams"][0];

    if (obj["version"] === 3 && obj["type"] === "MASTER") {
        if (s0.bandwidth        === "710852" &&
            s0.info             === 'BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.29",RESOLUTION=432x768' &&
            s0.codecs           === "avc1.66.30,mp4a.40.29" &&
            s0.video.codec      === "AVC"          &&
            s0.video.profile    === "Base"         &&
            s0.video.level      === "3.0"          &&
            s0.audio.codec      === "AAC"          &&
            s0.audio.profile    === "HE-AAC v2"    &&
            s0.audio.objectType === 29             &&
            s0.resolution       === "432x768") {

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

    var s0 = obj["streams"][0];

    if (obj["version"] === 3 && obj["type"] === "MASTER") {
        if (s0.bandwidth        === "710852" &&
            s0.info             === 'BANDWIDTH=710852,CODECS="avc1.66.30,mp4a.40.34",RESOLUTION=432x768' &&
            s0.codecs           === "avc1.66.30,mp4a.40.34" &&
            s0.video.codec      === "AVC"          &&
            s0.video.profile    === "Base"         &&
            s0.video.level      === "3.0"          &&
            s0.audio.codec      === "MP3"          &&
            s0.audio.profile    === "MP3"          &&
            s0.audio.objectType === 34             &&
            s0.resolution       === "432x768") {

            test.done(pass());
            return;
        }
    }
    test.done(miss());
}

function testM3U8_parseMediaPlaylist_Live(test, pass, miss) {

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

    if (obj["version"] === 3 &&
        obj["type"] === "LIVE" &&
        obj["allowCache"] === false &&
        obj["targetDuration"] === 2000 &&
        obj["mediaSequence"] === 1459) {

        var s0 = obj["mediaSegments"][0];
        var s1 = obj["mediaSegments"][1];
        var s2 = obj["mediaSegments"][2];
        if (s0.tsURL             === "media_w1360442349_1459.ts" &&
            s0.tsID              === 1459 &&
            s0.tsDuration        === 858  &&
            s0.tsRange.startTime === 0    &&
            s0.tsRange.endTime   === 858) {

            if (s1.tsURL             === "media_w1360442349_1460.ts" &&
                s1.tsID              === 1460  &&
                s1.tsDuration        === 886   &&
                s1.tsRange.startTime === 858   &&
                s1.tsRange.endTime   === 858 + 886) {

                if (s2.tsURL             === "media_w1360442349_1461.ts" &&
                    s2.tsID              === 1461 &&
                    s2.tsDuration        === 835  &&
                    s2.tsRange.startTime === 1744 &&
                    s2.tsRange.endTime   === 1744 + 835) {

                    test.done(pass());
                    return;
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

function testM3U8_buildMediaPlaylist_Live(test, pass, miss) {
    // MediaPlaylist -> parse -> build -> parse -> build -> restoration

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

function testM3U8_buildMediaPlaylist_VOD(test, pass, miss) {
    // MediaPlaylist -> parse -> build -> parse -> build -> restoration

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
media_w1360442349_1461.ts\n\
#EXT-X-ENDLIST';

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

function testM3U8_tsRange_VOD(test, pass, miss) {
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

    var mediaPlaylistObject = M3U8.parse(source);
    var mediaSegments = mediaPlaylistObject.mediaSegments;

    if (mediaSegments.length === 10) {
        if (mediaSegments[9].tsRange.startTime === 47576 &&
            mediaSegments[9].tsRange.endTime   === 49242) {
            test.done(pass());
            return;
        }
    }
    test.done(miss());
}

return test.run();

})(GLOBAL);

