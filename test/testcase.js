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
        testM3U8_tsRange_Live,
        testM3U8_loadMediaPlaylist_combined_Live_startTime0000,
        testM3U8_loadMediaPlaylist_combined_Live_startTime2000,
        testM3U8_loadMediaPlaylist_combined_Live_startTime11000,
        testM3U8_loadMediaPlaylist_combined_Live_startTime13000,
        testM3U8_loadMediaPlaylist_combined_Live_startTime15000,
        testM3U8_loadMediaPlaylist,
        testM3U8_loadMediaPlaylist_unsupported_profile,
        testM3U8_collectPlaylist,
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
        obj["type"] === "NRTLIVE" &&
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
        if (source === str1) {
            if (str1 === str2) {
                test.done(pass());
                return;
            }
        }
    }
    test.done(miss());
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
        if (source === str1) {
            if (str1 === str2) {
                test.done(pass());
                return;
            }
        }
    }
    test.done(miss());
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

function testM3U8_tsRange_Live(test, pass, miss) {
/*
    var tsRange_Live.m3u8 = '#EXTM3U\n\
#EXT-X-VERSION:3\n\
#EXT-X-MEDIA-SEQUENCE:0\n\
#EXT-X-ALLOW-CACHE:NO\n\
#EXT-X-TARGETDURATION:8\n\
#EXTINF:1.0,\n\    <- 0000-1000
a000.ts\n\
#EXTINF:1.1,\n\    <- 1000-2100
a001.ts\n\
#EXTINF:1.2,\n\    <- 2100-3300
a002.ts\n\
#EXTINF:1.3,\n\    <- 3300-4600
a003.ts\n\
#EXTINF:1.4,\n\    <- 4600-6000
a004.ts\n\
#EXTINF:1.5,\n\    <- 6000-7500
a005.ts\n\
#EXTINF:1.6,\n\    <- 7500-9100
a006.ts\n\
#EXTINF:1.7,\n\    <- 9100-10800
a007.ts\n\
#EXTINF:1.8,\n\    <- 10800-12600
a008.ts\n\
#EXTINF:1.9,\n\    <- 12600-14500
a009.ts';
 */

    var url = IN_NODE ? "test/assets/testM3U8_tsRange_Live.m3u8"
                      : "../assets/testM3U8_tsRange_Live.m3u8";

    M3U8.load(url, function(m3u8, url) {
        var playlist = M3U8.parse(m3u8, url);
        var mediaSegments = playlist.mediaSegments;

        if (mediaSegments.length === 10) {
            if (mediaSegments[0].tsRange.startTime === 0 &&
                mediaSegments[0].tsRange.endTime   === 1000) {
                if (mediaSegments[1].tsRange.startTime === 1000 &&
                    mediaSegments[1].tsRange.endTime   === 2100) {
                    if (mediaSegments[2].tsRange.startTime === 2100 &&
                        mediaSegments[2].tsRange.endTime   === 3300) {
                        if (mediaSegments[3].tsRange.startTime === 3300 &&
                            mediaSegments[3].tsRange.endTime   === 4600) {
                            if (mediaSegments[4].tsRange.startTime === 4600 &&
                                mediaSegments[4].tsRange.endTime   === 6000) {
                                if (mediaSegments[5].tsRange.startTime === 6000 &&
                                    mediaSegments[5].tsRange.endTime   === 7500) {
                                    if (mediaSegments[6].tsRange.startTime === 7500 &&
                                        mediaSegments[6].tsRange.endTime   === 9100) {
                                        if (mediaSegments[7].tsRange.startTime === 9100 &&
                                            mediaSegments[7].tsRange.endTime   === 10800) {
                                            if (mediaSegments[8].tsRange.startTime === 10800 &&
                                                mediaSegments[8].tsRange.endTime   === 12600) {
                                                if (mediaSegments[9].tsRange.startTime === 12600 &&
                                                    mediaSegments[9].tsRange.endTime   === 14500) {
                                                    test.done(pass());
                                                    return;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        test.done(miss());
    }, function(error, url) {
        console.error(error, url);
        test.done(miss());
    });

}

function testM3U8_loadMediaPlaylist_combined_Live_startTime0000(test, pass, miss) {
/*
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-COMBINED:YES
#EXTINF:1.0,\n\    <- 0000-1000 <- mediaSegments[0] mediaSequence = 0
a000.ts\n\
#EXTINF:1.1,\n\    <- 1000-2100 <- mediaSegments[1] mediaSequence = 1
a001.ts\n\
#EXTINF:1.2,\n\    <- 2100-3300 <- mediaSegments[2] mediaSequence = 2
a002.ts\n\
#EXTINF:1.3,\n\    <- 3300-4600
a003.ts\n\
#EXTINF:1.4,\n\    <- 4600-6000
a004.ts\n\
#EXTINF:1.5,\n\    <- 6000-7500
a005.ts\n\
#EXTINF:1.6,\n\    <- 7500-9100
a006.ts\n\
#EXTINF:1.7,\n\    <- 9100-10800
a007.ts\n\
#EXTINF:1.8,\n\    <- 10800-12600
a008.ts\n\
#EXTINF:1.9,\n\    <- 12600-14500
a009.ts';
 */

    var url = IN_NODE ? "test/assets/testM3U8_combined_Live.m3u8"
                      : "../assets/testM3U8_combined_Live.m3u8";

    M3U8.load(url, function(m3u8, url) {
        var playlist = M3U8.parse(m3u8, url);

        playlist = M3U8.trim(playlist, { startTime: 0, maxLength: 3 });

        var mediaSegments = playlist.mediaSegments;

        if (playlist.type === "LIVE" &&
            playlist.combined &&
            mediaSegments.length === 3) {
            if (mediaSegments[0].tsRange.startTime === 0 &&
                mediaSegments[0].tsRange.endTime   === 1000) {
                if (mediaSegments[1].tsRange.startTime === 1000 &&
                    mediaSegments[1].tsRange.endTime   === 2100) { // 1000+1100
                    if (mediaSegments[2].tsRange.startTime === 2100 &&
                        mediaSegments[2].tsRange.endTime   === 3300) { // 2100+1200
                        if (playlist.mediaSequence === 0) {
                            test.done(pass());
                            return;
                        }
                    }
                }
            }
        }
        test.done(miss());
    }, function(error, url) {
        console.error(error, url);
        test.done(miss());
    }, { timeout: 1000 });
}

function testM3U8_loadMediaPlaylist_combined_Live_startTime2000(test, pass, miss) {
/*
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-COMBINED:YES
#EXTINF:1.0,\n\    <- 0000-1000 <- skip             mediaSequence = 0
a000.ts\n\
#EXTINF:1.1,\n\    <- 1000-2100 <- mediaSegments[0] mediaSequence = 1
a001.ts\n\
#EXTINF:1.2,\n\    <- 2100-3300 <- mediaSegments[1] mediaSequence = 2
a002.ts\n\
#EXTINF:1.3,\n\    <- 3300-4600 <- mediaSegments[2] mediaSequence = 3
a003.ts\n\
#EXTINF:1.4,\n\    <- 4600-6000
a004.ts\n\
#EXTINF:1.5,\n\    <- 6000-7500
a005.ts\n\
#EXTINF:1.6,\n\    <- 7500-9100
a006.ts\n\
#EXTINF:1.7,\n\    <- 9100-10800
a007.ts\n\
#EXTINF:1.8,\n\    <- 10800-12600
a008.ts\n\
#EXTINF:1.9,\n\    <- 12600-14500
a009.ts';
 */

    var url = IN_NODE ? "test/assets/testM3U8_combined_Live.m3u8"
                      : "../assets/testM3U8_combined_Live.m3u8";

    M3U8.load(url, function(m3u8, url) {
        var playlist = M3U8.parse(m3u8, url);

        playlist = M3U8.trim(playlist, { startTime: 2000, maxLength: 3 });

        var mediaSegments = playlist.mediaSegments;

        if (playlist.type === "LIVE" &&
            playlist.combined &&
            mediaSegments.length === 3) {
            if (mediaSegments[0].tsRange.startTime === 1000 &&
                mediaSegments[0].tsRange.endTime   === 2100) { // 1000+1100
                if (mediaSegments[1].tsRange.startTime === 2100 &&
                    mediaSegments[1].tsRange.endTime   === 3300) { // 2100+1200
                    if (mediaSegments[2].tsRange.startTime === 3300 &&
                        mediaSegments[2].tsRange.endTime   === 4600) { // 3300+1300
                        if (playlist.mediaSequence === 1) {
                            test.done(pass());
                            return;
                        }
                    }
                }
            }
        }
        test.done(miss());
    }, function(error, url) {
        console.error(error, url);
        test.done(miss());
    }, { timeout: 1000 });
}

function testM3U8_loadMediaPlaylist_combined_Live_startTime11000(test, pass, miss) {
/*
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-COMBINED:YES
#EXTINF:1.0,\n\    <- 0000-1000 <- skip mediaSequence = 0
a000.ts\n\
#EXTINF:1.1,\n\    <- 1000-2100 <- skip mediaSequence = 1
a001.ts\n\
#EXTINF:1.2,\n\    <- 2100-3300 <- skip mediaSequence = 2
a002.ts\n\
#EXTINF:1.3,\n\    <- 3300-4600 <- skip mediaSequence = 3
a003.ts\n\
#EXTINF:1.4,\n\    <- 4600-6000 <- skip mediaSequence = 4
a004.ts\n\
#EXTINF:1.5,\n\    <- 6000-7500 <- skip mediaSequence = 5
a005.ts\n\
#EXTINF:1.6,\n\    <- 7500-9100 <- skip mediaSequence = 6
a006.ts\n\
#EXTINF:1.7,\n\    <- 9100-10800 <- skip mediaSequence = 7
a007.ts\n\
#EXTINF:1.8,\n\    <- 10800-12600 <- mediaSegments[0] mediaSequence = 8
a008.ts\n\
#EXTINF:1.9,\n\    <- 12600-14500 <- mediaSegments[1] mediaSequence = 9
a009.ts';
 */


    var url = IN_NODE ? "test/assets/testM3U8_combined_Live.m3u8"
                      : "../assets/testM3U8_combined_Live.m3u8";

    M3U8.load(url, function(m3u8, url) {
        var playlist = M3U8.parse(m3u8, url);

        playlist = M3U8.trim(playlist, { startTime: 11000, maxLength: 3 });

        var mediaSegments = playlist.mediaSegments;

        if (playlist.type === "LIVE" &&
            playlist.combined &&
            mediaSegments.length === 2) {
            if (mediaSegments[0].tsRange.startTime === 10800 &&
                mediaSegments[0].tsRange.endTime   === 12600) {
                if (mediaSegments[1].tsRange.startTime === 12600 &&
                    mediaSegments[1].tsRange.endTime   === 14500) {
                    if (playlist.mediaSequence === 8) {
                        test.done(pass());
                        return;
                    }
                }
            }
        }
        test.done(miss());
    }, function(error, url) {
        console.error(error, url);
        test.done(miss());
    }, { timeout: 1000 });
}

function testM3U8_loadMediaPlaylist_combined_Live_startTime13000(test, pass, miss) {
/*
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-COMBINED:YES
#EXTINF:1.0,\n\    <- 0000-1000 <- skip mediaSequence = 0
a000.ts\n\
#EXTINF:1.1,\n\    <- 1000-2100 <- skip mediaSequence = 1
a001.ts\n\
#EXTINF:1.2,\n\    <- 2100-3300 <- skip mediaSequence = 2
a002.ts\n\
#EXTINF:1.3,\n\    <- 3300-4600 <- skip mediaSequence = 3
a003.ts\n\
#EXTINF:1.4,\n\    <- 4600-6000 <- skip mediaSequence = 4
a004.ts\n\
#EXTINF:1.5,\n\    <- 6000-7500 <- skip mediaSequence = 5
a005.ts\n\
#EXTINF:1.6,\n\    <- 7500-9100 <- skip mediaSequence = 6
a006.ts\n\
#EXTINF:1.7,\n\    <- 9100-10800 <- skip mediaSequence = 7
a007.ts\n\
#EXTINF:1.8,\n\    <- 10800-12600 <- skip mediaSequence = 8
a008.ts\n\
#EXTINF:1.9,\n\    <- 12600-14500 <- mediaSegments[0] mediaSequence = 9
a009.ts';
 */


    var url = IN_NODE ? "test/assets/testM3U8_combined_Live.m3u8"
                      : "../assets/testM3U8_combined_Live.m3u8";

    M3U8.load(url, function(m3u8, url) {
        var playlist = M3U8.parse(m3u8, url);

        playlist = M3U8.trim(playlist, { startTime: 13000, maxLength: 3 });

        var mediaSegments = playlist.mediaSegments;

        if (playlist.type === "LIVE" &&
            playlist.combined &&
            mediaSegments.length === 1) {
            if (mediaSegments[0].tsRange.startTime === 12600 &&
                mediaSegments[0].tsRange.endTime   === 14500) {
                if (playlist.mediaSequence === 9) {
                    test.done(pass());
                    return;
                }
            }
        }
        test.done(miss());
    }, function(error, url) {
        console.error(error, url);
        test.done(miss());
    }, { timeout: 1000 });
}

function testM3U8_loadMediaPlaylist_combined_Live_startTime15000(test, pass, miss) {
/*
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-COMBINED:YES
#EXTINF:1.0,\n\    <- 0000-1000 <- skip mediaSequence = 0
a000.ts\n\
#EXTINF:1.1,\n\    <- 1000-2100 <- skip mediaSequence = 1
a001.ts\n\
#EXTINF:1.2,\n\    <- 2100-3300 <- skip mediaSequence = 2
a002.ts\n\
#EXTINF:1.3,\n\    <- 3300-4600 <- skip mediaSequence = 3
a003.ts\n\
#EXTINF:1.4,\n\    <- 4600-6000 <- skip mediaSequence = 4
a004.ts\n\
#EXTINF:1.5,\n\    <- 6000-7500 <- skip mediaSequence = 5
a005.ts\n\
#EXTINF:1.6,\n\    <- 7500-9100 <- skip mediaSequence = 6
a006.ts\n\
#EXTINF:1.7,\n\    <- 9100-10800 <- skip mediaSequence = 7
a007.ts\n\
#EXTINF:1.8,\n\    <- 10800-12600 <- skip mediaSequence = 8
a008.ts\n\
#EXTINF:1.9,\n\    <- 12600-14500 <- skip mediaSequence = 9
a009.ts';
 */


    var url = IN_NODE ? "test/assets/testM3U8_combined_Live.m3u8"
                      : "../assets/testM3U8_combined_Live.m3u8";

    M3U8.load(url, function(m3u8, url) {
        var playlist = M3U8.parse(m3u8, url);

        playlist = M3U8.trim(playlist, { startTime: 15000, maxLength: 3 });

        var mediaSegments = playlist.mediaSegments;

        if (playlist.type === "LIVE" &&
            playlist.combined &&
            mediaSegments.length === 0) {
                    if (playlist.mediaSequence === 0) {
                        test.done(pass());
                        return;
                    }
        }
        test.done(miss());
    }, function(error, url) {
        console.error(error, url);
        test.done(miss());
    }, { timeout: 1000 });
}

function testM3U8_loadMediaPlaylist(test, pass, miss) {
    var url = IN_NODE ? "test/assets/testM3U8_loadMediaPlaylist.master.m3u8"
                      : "../assets/testM3U8_loadMediaPlaylist.master.m3u8";

    M3U8.loadMediaPlaylist(url, function(m3u8, url, playlist) {
        var segments = playlist["mediaSegments"];
        if (segments.length === 3) {
            test.done(pass());
        } else {
            test.done(miss());
        }
    }, function(error, url, code) {
        test.done(miss());
    });
}

function testM3U8_loadMediaPlaylist_unsupported_profile(test, pass, miss) {
    var url = IN_NODE ? "test/assets/testM3U8_loadMediaPlaylist_unsupported_profile.master.m3u8"
                      : "../assets/testM3U8_loadMediaPlaylist_unsupported_profile.master.m3u8";

    // Master playlist
    //      Video: High profile Level 4.1
    //      Audio: AAC-LC
    // #EXTM3U
    // #EXT-X-VERSION:3
    // #EXT-X-STREAM-INF:BANDWIDTH=856501,CODECS="avc1.100.41,mp4a.40.2",RESOLUTION=360x640
    // chunklist_w917976154.m3u8

    M3U8.loadMediaPlaylist(url, function(m3u8, url, mediaPlaylist, masterPlaylist) {
        test.done(miss());
    }, function(error, url, code) {
        // Because will supports "Baseline profile" or "Main profile"
        console.log(error.message);
        test.done(pass());
    });
}

function testM3U8_collectPlaylist(test, pass, miss) {
    var url = IN_NODE ? "test/assets/testM3U8_loadMediaPlaylist.master.m3u8"
                      : "../assets/testM3U8_loadMediaPlaylist.master.m3u8";

    M3U8.collectPlaylist(url, function(playlists) { // @arg MasterPlaylist|MediaPlaylistArray - [playlist, ...]
        if (playlists.length === 2 &&
            playlists[0].type === "MASTER" &&
            playlists[1].type === "NRTLIVE") {
            test.done(pass());
        } else {
            test.done(miss());
        }
    }, function(error, url, code) {
        test.done(miss());
    });
}


return test.run();

})(GLOBAL);

