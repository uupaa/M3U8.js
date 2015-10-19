// M3U test

require("../lib/WebModule.js");

// publish to global
WebModule.publish = true;


require("./wmtools.js");
require("../lib/M3U.js");
require("../release/M3U.n.min.js");
require("./testcase.js");

