// M3U8 test

require("../../lib/WebModule.js");

WebModule.VERIFY  = true;
WebModule.VERBOSE = true;
WebModule.PUBLISH = true;

require("../../node_modules/uupaa.aacprofile.js/lib/AACProfile.js");
require("../../node_modules/uupaa.h264profile.js/lib/H264Profile.js");
require("../wmtools.js");
require("../../lib/M3U8.js");
require("../../lib/M3U8IndexPlaylist.js");
require("../../release/M3U8.n.min.js");
require("../testcase.js");

