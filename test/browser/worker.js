// M3U8 test

onmessage = function(event) {
    self.unitTest = event.data; // { message, setting: { secondary, baseDir } }

    if (!self.console) { // polyfill WebWorkerConsole
        self.console = function() {};
        self.console.dir = function() {};
        self.console.log = function() {};
        self.console.warn = function() {};
        self.console.error = function() {};
        self.console.table = function() {};
    }

    importScripts("../../lib/WebModule.js");

    WebModule.VERIFY  = true;
    WebModule.VERBOSE = true;
    WebModule.PUBLISH = true;

    importScripts("../../node_modules/uupaa.aacprofile.js/lib/AACProfile.js");
    importScripts("../../node_modules/uupaa.h264profile.js/lib/H264Profile.js");
    importScripts("../wmtools.js");
    importScripts("../../lib/M3U8.js");
    importScripts("../../release/M3U8.w.min.js");
    importScripts("../testcase.js");

    self.postMessage(self.unitTest);
};

