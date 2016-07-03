// M3U8 test

require("../../lib/WebModule.js");

WebModule.VERIFY  = true;
WebModule.VERBOSE = true;
WebModule.PUBLISH = true;

require("../../node_modules/uupaa.hexdump.js/lib/HexDump.js");
require("../../node_modules/uupaa.filestore.js/node_modules/uupaa.uri.js/lib/URI.js");
require("../../node_modules/uupaa.filestore.js/node_modules/uupaa.uri.js/lib/URISearchParams.js");
require("../../node_modules/uupaa.filestore.js/node_modules/uupaa.mimetype.js/lib/MimeType.js");
require("../../node_modules/uupaa.filestore.js/lib/FileStoreSandBox.js");
require("../../node_modules/uupaa.filestore.js/lib/FileStore.js");
require("../../node_modules/uupaa.mpeg2ts.js/node_modules/uupaa.bit.js/lib/Bit.js");
require("../../node_modules/uupaa.mpeg2ts.js/node_modules/uupaa.bit.js/lib/BitView.js");
require("../../node_modules/uupaa.mpeg2ts.js/node_modules/uupaa.hash.js/lib/Hash.js");
require("../../node_modules/uupaa.mpeg2ts.js/node_modules/uupaa.fileloader.js/lib/FileLoader.js");
require("../../node_modules/uupaa.mpeg2ts.js/node_modules/uupaa.fileloader.js/lib/FileLoaderQueue.js");
require("../../node_modules/uupaa.mpeg2ts.js/node_modules/uupaa.mpeg4bytestream.js/node_modules/uupaa.nalunit.js/lib/NALUnitType.js");
require("../../node_modules/uupaa.mpeg2ts.js/node_modules/uupaa.mpeg4bytestream.js/node_modules/uupaa.nalunit.js/lib/NALUnitParameterSet.js");
require("../../node_modules/uupaa.mpeg2ts.js/node_modules/uupaa.mpeg4bytestream.js/node_modules/uupaa.nalunit.js/lib/NALUnitEBSP.js");
require("../../node_modules/uupaa.mpeg2ts.js/node_modules/uupaa.mpeg4bytestream.js/node_modules/uupaa.nalunit.js/lib/NALUnitAUD.js");
require("../../node_modules/uupaa.mpeg2ts.js/node_modules/uupaa.mpeg4bytestream.js/node_modules/uupaa.nalunit.js/lib/NALUnitSPS.js");
require("../../node_modules/uupaa.mpeg2ts.js/node_modules/uupaa.mpeg4bytestream.js/node_modules/uupaa.nalunit.js/lib/NALUnitPPS.js");
require("../../node_modules/uupaa.mpeg2ts.js/node_modules/uupaa.mpeg4bytestream.js/node_modules/uupaa.nalunit.js/lib/NALUnitSEI.js");
require("../../node_modules/uupaa.mpeg2ts.js/node_modules/uupaa.mpeg4bytestream.js/node_modules/uupaa.nalunit.js/lib/NALUnitIDR.js");
require("../../node_modules/uupaa.mpeg2ts.js/node_modules/uupaa.mpeg4bytestream.js/node_modules/uupaa.nalunit.js/lib/NALUnitNON_IDR.js");
require("../../node_modules/uupaa.mpeg2ts.js/node_modules/uupaa.mpeg4bytestream.js/node_modules/uupaa.nalunit.js/lib/NALUnit.js");
require("../../node_modules/uupaa.mpeg2ts.js/node_modules/uupaa.mpeg4bytestream.js/lib/MPEG4ByteStream.js");
require("../../node_modules/uupaa.mpeg2ts.js/lib/MPEG2TSParser.js");
require("../../node_modules/uupaa.mpeg2ts.js/lib/MPEG2TS.js");
require("../../node_modules/uupaa.aac.js/lib/AAC.js");
require("../../node_modules/uupaa.aac.js/lib/ADTS.js");
require("../../node_modules/uupaa.mp4builder.js/node_modules/uupaa.typedarray.js/lib/TypedArray.js");
require("../../node_modules/uupaa.mp4builder.js/lib/MP4Builder.js");
require("../../node_modules/uupaa.mp4muxer.js/node_modules/uupaa.mp4parser.js/lib/MP4Parser.js");
require("../../node_modules/uupaa.mp4muxer.js/node_modules/uupaa.h264profile.js/lib/H264Profile.js");
require("../../node_modules/uupaa.mp4muxer.js/lib/MP4Muxer.js");
require("../../node_modules/uupaa.task.js/lib/Task.js");
require("../../node_modules/uupaa.task.js/lib/TaskMap.js");
require("../../node_modules/uupaa.aacprofile.js/lib/AACProfile.js");
require("../wmtools.js");
require("../../lib/M3U8.js");
require("../../lib/M3U8LiveSpooler.js");
require("../../lib/M3U8MovieSpooler.js");
require("../../lib/M3U8Spooler.js");
require("../../release/M3U8.n.min.js");
require("../testcase.js");

