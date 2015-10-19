# M3U.js [![Build Status](https://travis-ci.org/uupaa/M3U.js.svg)](https://travis-ci.org/uupaa/M3U.js)

[![npm](https://nodei.co/npm/uupaa.m3u.js.svg?downloads=true&stars=true)](https://nodei.co/npm/uupaa.m3u.js/)

M3U parser

- Please refer to [Spec](https://github.com/uupaa/M3U.js/wiki/) and [API Spec](https://github.com/uupaa/M3U.js/wiki/M3U) links.
- The M3U.js is made of [WebModule](https://github.com/uupaa/WebModule).

## Browser and NW.js(node-webkit)

```js
<script src="<module-dir>/lib/WebModule.js"></script>
<script src="<module-dir>/lib/M3U.js"></script>
<script>

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

m3u.version           // -> 3
m3u.duration          // -> 2
m3u.sequence          // -> 1459
m3u.file[0].duration  // -> 0.858
m3u.file[0].url       // -> media_w1360442349_1459.ts

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

