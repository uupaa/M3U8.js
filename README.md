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
var text = "#EXTM3U\n#EXT-X-VERSION:3\n....";

var m3u = M3U.parse(text);

m3u["EXT-X-VERSION"]; // 3

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

