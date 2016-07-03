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
        testM3U8_filterMovieHead,
        testM3U8_filterLiveHead,
        testM3U8_filterMovieSequenceIsNotZero,
        testM3U8_filterLiveSequenceIsNotZero,
        testM3U8_filterMovieSequenceIsNotZeroWithIndex,
        testM3U8_filterLiveSequenceIsNotZeroWithIndex,
/*
        testM3U8IndexPlaylist_merge_and_has,
        testM3U8IndexPlaylist_fetch_and_clear,
        testM3U8IndexPlaylist_properties,
 */
    ]);
/*
    if (IN_EL || IN_NW) {
        test.add([
            testM3U8Loader,
        ]);
    }
 */

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

function testM3U8IndexPlaylist_merge_and_has(test, pass, miss) {
    var source1 = '#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-ALLOW-CACHE:NO\n\
#EXT-X-TARGETDURATION:2\n\
#EXT-X-MEDIA-SEQUENCE:1\n\
#EXTINF:1.1,\n\
0001.ts\n\
#EXTINF:1.2,\n\
0002.ts\n\
#EXTINF:1.3,\n\
0003.ts';

    var source2 = '#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-ALLOW-CACHE:NO\n\
#EXT-X-TARGETDURATION:2\n\
#EXT-X-MEDIA-SEQUENCE:2\n\
#EXTINF:1.2,\n\
0002.ts\n\
#EXTINF:1.3,\n\
0003.ts\n\
#EXTINF:1.4,\n\
0004.ts';

    var source3 = '#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-ALLOW-CACHE:NO\n\
#EXT-X-TARGETDURATION:2\n\
#EXT-X-MEDIA-SEQUENCE:4\n\
#EXTINF:1.4,\n\
0004.ts\n\
#EXTINF:1.5,\n\
0005.ts\n\
#EXTINF:1.6,\n\
0006.ts';

    var m3u8IndexPlaylist = new M3U8IndexPlaylist();

    m3u8IndexPlaylist.merge(source1); // 1.1 + 1.2 + 1.3 = 3.56 sec

    if ( m3u8IndexPlaylist.has(3.5 * 1000) ) { // 3.5秒分のデータがあるか?
        m3u8IndexPlaylist.merge(source2); // 1.1 + 1.2 + 1.3 + 1.4 = 5 sec

        if ( m3u8IndexPlaylist.has(5.0 * 1000) ) { // 5.0秒分のデータがあるか?
            m3u8IndexPlaylist.merge(source3); // 1.1 + 1.2 + 1.3 + 1.4 + 1.5 + 1.6 = 8.1sec

            if ( m3u8IndexPlaylist.has(8.1 * 1000) ) { // 8.1秒分のデータがあるか?
                test.done(pass());
                return;
            }
        }
    }
    test.done(miss());
}

function testM3U8IndexPlaylist_fetch_and_clear(test, pass, miss) {

    var source1 = '#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-ALLOW-CACHE:NO\n\
#EXT-X-TARGETDURATION:2\n\
#EXT-X-MEDIA-SEQUENCE:1\n\
#EXTINF:1.1,\n\
0001.ts\n\
#EXTINF:1.2,\n\
0002.ts\n\
#EXTINF:1.3,\n\
0003.ts';

    var source2 = '#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-ALLOW-CACHE:NO\n\
#EXT-X-TARGETDURATION:2\n\
#EXT-X-MEDIA-SEQUENCE:2\n\
#EXTINF:1.2,\n\
0002.ts\n\
#EXTINF:1.3,\n\
0003.ts\n\
#EXTINF:1.4,\n\
0004.ts';

    var m3u8IndexPlaylist = new M3U8IndexPlaylist();

    m3u8IndexPlaylist.merge(source1); // 1.1 + 1.2 + 1.3 = 3.56 sec
    m3u8IndexPlaylist.merge(source2); // 1.1 + 1.2 + 1.3 + 1.4 = 5 sec

    var subStream = m3u8IndexPlaylist.use(3 * 1000);

    if (subStream.length === 3 && m3u8IndexPlaylist.stream.length === 1) {
        m3u8IndexPlaylist.clear();
        if (m3u8IndexPlaylist.stream.length === 0) {
            test.done(pass());
            return;
        }
    }
    test.done(miss());
}

function testM3U8IndexPlaylist_properties(test, pass, miss) {

    var source1 = '#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-ALLOW-CACHE:NO\n\
#EXT-X-TARGETDURATION:2\n\
#EXT-X-MEDIA-SEQUENCE:1\n\
#EXTINF:1.1,\n\
0001.ts\n\
#EXTINF:1.2,\n\
0002.ts\n\
#EXTINF:1.3,\n\
0003.ts';

    var m3u8IndexPlaylist = new M3U8IndexPlaylist(source1);

    if (m3u8IndexPlaylist.live) {
        if (m3u8IndexPlaylist.type === "LIVE") {
            if (m3u8IndexPlaylist.version === 3) {
                if (m3u8IndexPlaylist.cache === false) {
                    if (m3u8IndexPlaylist.duration === 2000) {
                        if (m3u8IndexPlaylist.sequence === 1) {
                            test.done(pass());
                            return;
                        }
                    }
                }
            }
        }
    }
    test.done(miss());
}

function testM3U8Loader(test, pass, miss) {
    var source1 = '\n\
#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-ALLOW-CACHE:NO\n\
#EXT-X-TARGETDURATION:2\n\
#EXT-X-MEDIA-SEQUENCE:138\n\
#EXTINF:1.218,\n\
media_w391820094_138.ts\n\
#EXTINF:1.069,\n\
media_w391820094_139.ts\n\
#EXTINF:1.054,\n\
media_w391820094_140.ts\n\
';

    var source2 = '\n\
#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-ALLOW-CACHE:NO\n\
#EXT-X-TARGETDURATION:2\n\
#EXT-X-MEDIA-SEQUENCE:139\n\
#EXTINF:1.069,\n\
media_w391820094_139.ts\n\
#EXTINF:1.054,\n\
media_w391820094_140.ts\n\
#EXTINF:1.167,\n\
media_w391820094_141.ts\n\
';

    var source3 = '\n\
#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-ALLOW-CACHE:NO\n\
#EXT-X-TARGETDURATION:2\n\
#EXT-X-MEDIA-SEQUENCE:141\n\
#EXTINF:1.167,\n\
media_w391820094_141.ts\n\
#EXTINF:1.189,\n\
media_w391820094_142.ts\n\
#EXTINF:1.101,\n\
media_w391820094_143.ts\n\
';

    var source4 = '\n\
#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-ALLOW-CACHE:NO\n\
#EXT-X-TARGETDURATION:2\n\
#EXT-X-MEDIA-SEQUENCE:142\n\
#EXTINF:1.189,\n\
media_w391820094_142.ts\n\
#EXTINF:1.101,\n\
media_w391820094_143.ts\n\
#EXTINF:1.003,\n\
media_w391820094_144.ts\n\
';

    MPEG2TSParser.VERBOSE = false;
    MPEG2TS.VERBOSE = false;
    ADTS.VERBOSE = false;
    MP4Muxer.VERBOSE = false;
    MP4Builder.VERBOSE = false;
    NALUnitAUD.VERBOSE = false;
    NALUnitEBSP.VERBOSE = false;
    NALUnitIDR.VERBOSE = false;
    MPEG4ByteStream.VERBOSE = false;

    var streams           = [source1, source2, source3, source4];
    var counter           = 1000;
    var m3u8IndexPlaylist = new M3U8IndexPlaylist();
    var m3u8Loader        = new M3U8Loader();
    var baseURL           = "../assets/";
    var combined_ts       = "combined.ts";
    var combined_mp4      = "combined.mp4";
    var combined_aac      = "combined.aac";

    var task = new Task("", 2, function(error, buffer) {
        if (error) {
            test.done(miss());
        } else {
            if (m3u8IndexPlaylist.used.join(",") === "138,139,140,141,142,143") {
                if (m3u8IndexPlaylist.stream[0]["index"] === 144) { // remain
                    test.done(pass());
                    return;
                }
            }
            test.done(miss());
        }
    });

    streams.forEach(function(source) {
        m3u8IndexPlaylist.merge(source);

        var substream = m3u8IndexPlaylist.use(3000);

        _puts(baseURL, substream);
    });

    function _puts(baseURL, substream) {
        m3u8Loader.add(baseURL, substream, function(blobURL, indexes) {
            console.log({ blobURL: blobURL, streamIndexes: indexes.join(",") });

            FileLoader.toArrayBuffer(blobURL, function(arrayBuffer) {
                var mpeg2ts         = MPEG2TS.parse( new Uint8Array(arrayBuffer) );
                var videoByteStream = MPEG2TS.convertTSPacketToByteStream( mpeg2ts["VIDEO_TS_PACKET"] );
                var audioByteStream = MPEG2TS.convertTSPacketToByteStream( mpeg2ts["AUDIO_TS_PACKET"] );
                var adts            = ADTS.parse( audioByteStream );
                var nalUnit         = MPEG4ByteStream.convertByteStreamToNALUnitObjectArray( videoByteStream );
                var mp4tree         = MP4Muxer.mux( nalUnit, { audioDuration: adts.duration } );
                var mp4file         = MP4Builder.build(mp4tree); // { stream, diagnostic }

                require("fs").writeFileSync(baseURL + counter + "." + combined_ts,  new Buffer(arrayBuffer), "binary");
                require("fs").writeFileSync(baseURL + counter + "." + combined_mp4, new Buffer(mp4file.stream.buffer), "binary");
                require("fs").writeFileSync(baseURL + counter + "." + combined_aac, new Buffer(audioByteStream.buffer), "binary");
                counter++;
                task.pass();

            }, function(error) {
                task.miss();
            });
        }, function(error, indexes) {
            task.miss();
        });
    }
}

return test.run();

})(GLOBAL);

