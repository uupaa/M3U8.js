# M3U8.js [![Build Status](https://travis-ci.org/uupaa/M3U8.js.svg)](https://travis-ci.org/uupaa/M3U8.js)

[![npm](https://nodei.co/npm/uupaa.m3u8.js.svg?downloads=true&stars=true)](https://nodei.co/npm/uupaa.m3u8.js/)

M3U8 Parser and Builder.

This module made of [WebModule](https://github.com/uupaa/WebModule).

## Documentation
- [Overview](https://github.com/uupaa/M3U8.js/wiki/)
- [API Spec](https://github.com/uupaa/M3U8.js/wiki/M3U8)

## Browser, NW.js and Electron

```js
<script src="<module-dir>/lib/WebModule.js"></script>
<script src="<module-dir>/lib/M3U8.js"></script>
<script>

var m3u8 = "\n\
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

var mediaPlaylistObject = M3U8.parse(m3u8);

mediaPlaylistObject.version                 // -> 3
mediaPlaylistObject.targetDuration          // -> 2000 (2.0 * 1000)(msec)
mediaPlaylistObject.mediaSequence           // -> 1459
mediaPlaylistObject.mediaSegments.length    // -> 3

var mediaSegment0 = mediaPlaylistObject.mediaSegments[0];
var mediaSegment1 = mediaPlaylistObject.mediaSegments[1];

mediaSegment0.tsID                          // -> 1459
mediaSegment0.tsURL                         // -> "media_w1360442349_1459.ts"
mediaSegment0.tsDuration                    // -> 858  (0.858 * 1000)(msec)
mediaSegment0.tsTitle                       // -> ""
mediaSegment0.tsRange.startTime             // -> 0    (0.000 * 1000)(msec)
mediaSegment0.tsRange.endTime               // -> 858  (0.858 * 1000)(msec)

mediaSegment1.tsID                          // -> 1460
mediaSegment1.tsURL                         // -> "media_w1360442349_1460.ts"
mediaSegment1.tsDuration                    // -> 886  (msec)
mediaSegment1.tsTitle                       // -> ""
mediaSegment1.tsRange.startTime             // -> 858  (0.858 * 1000)(msec)
mediaSegment1.tsRange.endTime               // -> 1744 ((0.858 + 0.886) * 1000)(msec)

</script>
```

## WebWorkers

```js
importScripts("<module-dir>/lib/WebModule.js");
importScripts("<module-dir>/lib/M3U8.js");

```

## Node.js

```js
require("<module-dir>/lib/WebModule.js");
require("<module-dir>/lib/M3U8.js");

```

