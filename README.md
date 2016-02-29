# M3U.js [![Build Status](https://travis-ci.org/uupaa/M3U.js.svg)](https://travis-ci.org/uupaa/M3U.js)

[![npm](https://nodei.co/npm/uupaa.m3u.js.svg?downloads=true&stars=true)](https://nodei.co/npm/uupaa.m3u.js/)

M3U/M3U8 parser and builder.

This module made of [WebModule](https://github.com/uupaa/WebModule).

## Documentation
- [Spec](https://github.com/uupaa/M3U.js/wiki/)
- [API Spec](https://github.com/uupaa/M3U.js/wiki/M3U)

## Browser, NW.js and Electron

```js
<script src="<module-dir>/lib/WebModule.js"></script>
<script src="<module-dir>/lib/M3U.js"></script>
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

var obj = M3U.parse(m3u8); // -> Object. { VERSION: 3, DURATION: 2, ... }
var str = M3U.build(obj);  // -> M3U format string. "EXTM3U\n...."

obj.VERSION             // -> 3
obj.DURATION            // -> 2
obj.SEQUENCE            // -> 1459
obj.STREAM[0].DURATION  // -> "0.858"
obj.STREAM[0].URL       // -> "media_w1360442349_1459.ts"

</script>
```

## WebWorkers

```js
importScripts("<module-dir>lib/WebModule.js");
importScripts("<module-dir>lib/M3U.js");

```

## Node.js

```js
require("<module-dir>lib/WebModule.js");
require("<module-dir>lib/M3U.js");

```

