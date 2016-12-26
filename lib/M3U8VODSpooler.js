(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("M3U8VODSpooler", function moduleClosure(global, WebModule, VERIFY, VERBOSE) {
"use strict";

// --- technical terms / data structure --------------------
/*
ChunkObject: Object
    - stream:       ObjectArray - [{ index, url, duration }, ...]
        - index:        UINT32
        - url:          URLString
        - duration:     UINT32
    - indexes:      UIN32Array - [index, ...]
    - duration:     UINT32 - estimated durarion from M3U8 index playlist
    - buffer:       BlobArray

- TSObject: Object - { index, url, state, duration, startTime, endTime, created_at, updated_at }
    - index         UINT32 - ts index
    - url           URLString
    - state         UINT8  - status (STATE_NEW, STATE_BLOB_CACHED, STATE_BLOB_RESERVED, STATE_RELEASED, STATE_ERROR)
    - duration      UINT32 - ms
    - startTime     UINT32 - ms
    - endTime       UINT32 - ms
    - created_at    UINT32 - time_t
    - updated_at    UINT32 - time_t
 */
// --- dependency modules ----------------------------------
var M3U8            = WebModule["M3U8"];
var FileLoader      = WebModule["FileLoader"];
// --- import / local extract functions --------------------
// --- define / local variables ----------------------------
var STATE_NEW           = 0; // "N" - tsMap, blobMap を作成した状態, Blob 読み込み対象
var STATE_LOADING       = 1; // "L" - Blob 読込中
var STATE_BLOB_CACHED   = 2; // "C" - blobMap[tsIndex] != null の状態, Blob作成済み
var STATE_BLOB_RESERVED = 3; // "B" - blobMap[tsIndex] != null の状態, Blob使用予約済み
var STATE_RELEASED      = 4; // "R" - blobMap[tsIndex] = null の状態, Blob 使用済み。この状態になったら再読み込みは発生しない
var STATE_ERROR         = 5; // "E" - blobMap[tsIndex] = null の状態, エラー, 読み込まない
// --- class / interfaces ----------------------------------
function M3U8VODSpooler(url,       // @arg URLString
                        options) { // @arg Object - { durationThreshold, overthresholdCallback, errorCallback, fetchM3U8Callback, loadTSCallback }
                                   // @options.durationThreshold     UINT32 = 0 - ms
                                   // @options.overthresholdCallback Function = null - overthresholdCallback(cachedDuration:UINT32):void
                                   // @options.errorCallback         Function = null - errorCallback(url:URLString, m3u8:String):void
                                   // @options.m3u8Callback          Function = null - m3u8Callback(url:URLString, m3u8:String, playlist:IndexPlaylistObject):void
                                   // @options.tsCallback            Function = null - tsCallback(url:URLString, tsIndex:UINT32, blob:Blob):void
    this._src                   = url;  // IndexPlaylistObject
    this._durationThreshold     = options["durationThreshold"] || 0;
    this._overthresholdCallback = options["overthresholdCallback"] || function() {};
    this._errorCallback         = options["errorCallback"] || function(event) {
        // { type: "error", detail: { url, code } } or { type: "timeout", detail: { url, code } }
        console.error("M3U8VODSpooler::event", event["type"], event["detail"]);
    };
    this._m3u8Callback = options["m3u8Callback"] || function() {
        if (M3U8VODSpooler["VERBOSE"]) {
            console.info("M3U8VODSpooler::fetched M3U8", event["type"], event["detail"]);
        }
    };
    this._tsCallback = options["tsCallback"] || function(url, tsIndex, blob) {
        if (M3U8VODSpooler["VERBOSE"]) {
            console.info("M3U8VODSpooler::fetched MPEG2-TS", url, tsIndex, blob["size"]);
        }
    };
    this._fetchfn               = _fetch.bind(this);
    this._fetchTimerID          = 0;    // fetch timer id. (setTimeout timer)
    this._fetchInterval         = 0;
    this._blobMap               = {};   // { tsIndex: Blob, ... }
    this._tsMap                 = {};   // { tsIndex: TSObject, ... }
    this._cachedDuration        = 0;    // ms. sum(ts.duration) if STATE_BLOB_CACHED
    this._lastM3U8String        = "";   // diff check
    this._stopped               = true;
    this._live                  = false;
    this._movieDuration         = 0;    // Playlist duration (estimated duration)
    this._view = {
        cursor:     0,                  // current tsIndexes cursor. use(), seek() で変化する
        tsIndexes:  [],                 // [tsIndex, ...]
    };

    // --- UNGREEDY mode properties ---
    this._suppressMemoryUsage = true;
    this._connections       = 0;
    this._maxConnections    = 5;
    this._maxBlobCached     = 5;
    this._maxBlobReserved   = 5;
}

M3U8VODSpooler["VERBOSE"] = VERBOSE;
M3U8VODSpooler["prototype"] = Object.create(M3U8VODSpooler, {
    "constructor":      { "value": M3U8VODSpooler         }, // new M3U8VODSpooler(...):M3U8VODSpooler
    "has":              { "value": M3U8VODSpooler_has     }, // #has(ms:UINT32):Boolean
    "use":              { "value": M3U8VODSpooler_use     }, // #use(ms:UINT32):ChunkObject|null
    "seek":             { "value": M3U8VODSpooler_seek    }, // #seek(seekTime:UINT32):Object|null - { index, startTime, endTime }
    "start":            { "value": M3U8VODSpooler_start   }, // #start():void
    "stop":             { "value": M3U8VODSpooler_stop    }, // #stop():void
    "clear":            { "value": M3U8VODSpooler_clear   }, // #clear():void
    "release":          { "value": M3U8VODSpooler_release }, // #release(indexes:UINT32Array):void
    "cachedDuration":   { "get": function() { return this._cachedDuration; } },
    "movieDuration":    { "get": function() { return this._movieDuration;  } },
});

// --- implements ------------------------------------------
function M3U8VODSpooler_start() {
    this["stop"]();
    this._stopped = false;
    this._fetchfn();
}

function M3U8VODSpooler_stop() {
    if (this._fetchTimerID) {
        clearTimeout(this._fetchTimerID);
        this._fetchTimerID = 0;
    }
    this._stopped = true;
}

function _fetch() { // @desc playlist.m3u8 を読み込み ts ファイルの情報をマージする
    var that = this;

    if (this._src) {
        if (!this._live) {
            // Liveはm3u8を定期的に再読み込みする必要があるがVODは1度だけで良い
            if (this._movieDuration) { // m3u8 fetched?
                if (this._view.cursor === this._view.tsIndexes.length - 1) { // finished?
                    this["stop"]();
                } else {
                    if (this._stopped) { return; }
                    this._fetchTimerID = setTimeout(this._fetchfn, this._fetchInterval); // fetch timer restart.
                    _cache(this);
                }
                return;
            }
        }

        // Liveでは繰り返しここにくるが
        // VODではここは1度しか走らない
        M3U8["load"](this._src, function(m3u8, url) {
            if (that._stopped) { return; }
            that._fetchTimerID = setTimeout(that._fetchfn, that._fetchInterval); // fetch timer restart.

            if (that._lastM3U8String !== m3u8) { // modified?
                that._lastM3U8String = m3u8;

                var playlist = M3U8["parse"](m3u8, url); // IndexPlaylistObject

                if (playlist) {
                    that._m3u8Callback(url, m3u8, playlist);
                    if (M3U8VODSpooler["VERBOSE"]) {
                        _dumpStream(playlist);
                    }

                    that._fetchInterval = (playlist["targetDuration"] <= 3000) ? 400 : 1000;
                    that._movieDuration = that._live ? 0 : playlist["duration"];
                    _merge(that, playlist["stream"]);
                    _cache(that);
                }
            }
        }, function(error, url, code) {
            console.error(error.message, url, code);

            if (that._errorCallback) {
                var eventType = error.message === "TIMEOUT" ? "timeout" : "error";

                that._errorCallback({ "type": eventType, "detail": { "url": url, "code": code } });
            } else {
                console.error("M3U8LiveSpooler connection lost");
            }
        }, { "timeout": 5000 });
    }
}

function M3U8VODSpooler_has(ms) { // @arg UINT32 - milliseconds
    return this._cachedDuration >= ms;
}

function M3U8VODSpooler_use(ms) { // @arg UINT32 - milliseconds
                                  // @ret ChunkObject|null - { stream:ObjectArray, indexes:UIN32Array, duration:UINT32, buffer:BlobArray }
                                  // @desc 利用可能な区間を見つけて indexes を返し、それらを STATE_BLOB_RESERVED にする
    if (this._cachedDuration < ms) {
        return null;
    }
    var result = {
        "stream":   [], // TSObjectArray - [ts, ...]
        "indexes":  [], // UINT32 - [tsIndex, ...] 利用可能なtsIndexの配列。恐らく連番になっている
        "duration": 0,  // 利用可能なtsIndexのdurationの合計値
        "buffer":   [], // BlobArray - [blob, ...]
    };
    for (var i = this._view.cursor, iz = this._view.tsIndexes.length; i < iz; ++i) {
        var tsIndex = this._view.tsIndexes[i];
        var ts      = this._tsMap[tsIndex];

        if (ts["state"] === STATE_BLOB_CACHED) { // STATE_BLOB_CACHED -> STATE_BLOB_RESERVED
            ts["state"] = STATE_BLOB_RESERVED;
            ts["updated_at"] = Date.now();

            result["duration"] += ts["duration"];
            result["indexes"].push(tsIndex);
            result["buffer"].push(this._blobMap[tsIndex]);
            result["stream"].push(ts);

            if (result["duration"] >= ms) {
                this._cachedDuration -= result["duration"];
                this._view.cursor = i; // move cursor

                return result;
            }
        }
    }
    return null;
}

function M3U8VODSpooler_seek(seekTime) { // @arg UINT32 - seek target time, seek estimated time.
                                         // @ret Object|null - { index:UINT32, startTime:UINT32, endTime:UINT32 }
                                         // @desc playlist 全体から ts.startTime <= seekTime <= ts.endTime に一致する ts を検索する
                                         //       seek を実行すると全てのキャッシュを破棄する
    if (this._live) { return null; }

    for (var i = 0, iz = this._view.tsIndexes.length; i < iz; ++i) { // [tsIndex, ...]
        var tsIndex   = this._view.tsIndexes[i];
        var ts        = this._tsMap[tsIndex]; // { index, url, state, duration, startTime, endTime }
        var startTime = ts["startTime"];
        var endTime   = ts["endTime"];

        if (seekTime >= startTime && seekTime <= endTime) { // include seek time
          //var a = this._view.cursor; // point a, old head
            var b = i;                 // point b, new head

            // キャッシュ破棄戦略
            //
            // 1. a = b の場合はseek不要? -> ts が１つしかない場合は 再取得が必要なのでseekが必要
            //
            //  if (a === b) {
            //      return { "index": tsIndex, "startTime": startTime, "endTime": endTime, };
            //  }
            //
            // 2. 過去にシーク(b < a) -> 全区間を破棄する
            //      -> 0 〜 b   には STATE_RELEASED を設定し、再読み込み対象から外す
            //      -> b 〜 end には STATE_NEW      を設定し、再読み込み対象に設定する
            //                            +-------------------+
            //                            v                   |
            //
            //        0...................b...................a....................end
            //        | STATE_RELEASED    |     STATE_NEW     |   STATE_NEW         |
            //
            //  if (b < a) {
            //      _release(this, this._view.slice(0, b), STATE_RELEASED); // 0 .. b   -> STATE_RELEASED
            //      _release(this, this._view.slice(b),    STATE_NEW);      // b .. end -> STATE_NEW
            //      this._view.cursor = b;
            //  }
            //
            // 3. 未来にシーク(b > a) ->
            //      -> 0 〜 b   には STATE_RELEASED を設定し、再読み込み対象から外す
            //      -> a 〜 b   には STATE_RELEASED を設定し、再読み込み対象から外す
            //      -> b 〜 end には STATE_NEW      を設定し、再読み込み対象にする
            //
            //                            +-------------------+
            //                            |                   v
            //
            //        0...................a...................b....................end
            //        | STATE_RELEASED    |   STATE_RELEASED  |   STATE_NEW         |
            //
            //  if (b >= a) {
            //      _release(this, this._view.slice(0, b), STATE_RELEASED); // 0 .. b   -> STATE_RELEASED
            //      _release(this, this._view.slice(b),    STATE_NEW);      // b .. end -> STATE_NEW
            //      this._view.cursor = b;
            //  }
            //
            // 結局 1. と 2. と 3. は以下のコードで表現できる

            _reload.call(this, this._view.tsIndexes.slice(0, b), STATE_RELEASED); // 0 .. b   -> STATE_RELEASED
            _reload.call(this, this._view.tsIndexes.slice(b),    STATE_NEW);      // b .. end -> STATE_NEW
            this._cachedDuration = 0;
            this._view.cursor = b; // update

            _cache(this);    // seek直後でキャッシュが空なため素早く再取得を行う
            this["start"](); // fetch timerが停止している可能性があるため、再スタートを行う

            return {
                "index":     tsIndex,
                "startTime": startTime,
                "endTime":   endTime,
            };
        }
    }
    return null;
}

function _reload(tsIndexArray, // @arg UINT32Array - [tsIndex, ...]
                 newState) {   // @arg UINT8
    var now = Date.now();

    for (var i = 0, iz = tsIndexArray.length; i < iz; ++i) {
        var tsIndex = tsIndexArray[i];
        if (tsIndex in this._tsMap) {
            var ts = this._tsMap[tsIndex]; // { index, url, state, duration, startTime, endTime, created_at, updated_at }

            this._blobMap[tsIndex] = null;
            ts["updated_at"] = now;
            ts["state"] = newState;
        }
    }
}

function M3U8VODSpooler_release(tsIndexArray) { // @arg UINT32Array - [tsIndex, ...]
    var now = Date.now();

    for (var i = 0, iz = tsIndexArray.length; i < iz; ++i) {
        var tsIndex = tsIndexArray[i];
        if (tsIndex in this._tsMap) {
            var ts = this._tsMap[tsIndex]; // { index, url, state, duration, startTime, endTime, created_at, updated_at }

            if (ts["state"] === STATE_BLOB_RESERVED) {
                this._blobMap[tsIndex] = null;
                ts["updated_at"] = now;
                ts["state"] = STATE_RELEASED; // STATE_BLOB_RESERVED -> STATE_RELEASED
            }
        }
    }
    this._cachedDuration = _calcPlayableDuration.call(this); // update
}

function M3U8VODSpooler_clear() {
    this._src           = "";
    this._stopped       = true;
    this._blobMap       = {};
    this._tsMap         = {};
    this._cachedDuration = 0;
    this._view = { cursor: 0, tsIndexes: [] };
}

function _merge(that, stream) { // @arg IndexPlaylistStreamObjectArray - [{ index, url, duration, title, fragment }, ...]
                                // @desc playlist.m3u8 の内容を tsMap にマージする。VODでは1度しか呼ばれない
    var now = Date.now();

    for (var i = 0, iz = stream.length; i < iz; ++i) {
        var tsIndex     = stream[i]["index"];       // UINT32
        var url         = stream[i]["url"];         // URLString
        var duration    = stream[i]["duration"];    // UINT32 (ms)
        var startTime   = stream[i]["fragment"][0]; // UINT32 (ms)
        var endTime     = stream[i]["fragment"][1]; // UINT32 (ms)

        if ( !(tsIndex in that._tsMap) ) { // new index
            that._blobMap[tsIndex] = null;
            that._tsMap[tsIndex] = {
                "index":        tsIndex,    // UINT32
                "url":          url,        // URLString
                "state":        STATE_NEW,  // UINT8
                "duration":     duration,   // UINT32 (ms)
                "startTime":    startTime,  // UINT32 (ms)
                "endTime":      endTime,    // UINT32 (ms)
                "created_at":   now,        // UINT32 (time_t)
                "updated_at":   now,        // UINT32 (time_t)
            };
            that._view.tsIndexes.push(tsIndex);   // [tsIndex, ...]
        }
    }
}

function _cache(that) {
    // @desc ts を読み込みBlob化する。このメソッドは定期的に呼ばれる
    if (M3U8VODSpooler["VERBOSE"]) {
        console.info("VOD STATE", {
            "movieDuration":    that._movieDuration,
            "cachedDuration":   that._cachedDuration,
            "connections":      that._connections,
            "state":            _toStateString.call(that),
        });
    }

    if (that._suppressMemoryUsage) {
        var counts = _countQueueState.call(that, STATE_BLOB_CACHED); // { STATE_NEW, STATE_LOADING, STATE_BLOB_CACHED, STATE_BLOB_RESERVED, STATE_RELEASED, STATE_ERROR }

        if (counts[STATE_BLOB_CACHED]   >= that._maxBlobCached ||
            counts[STATE_BLOB_RESERVED] >= that._maxBlobReserved) {
            return;
        }
    }

    for (var i = that._view.cursor, iz = that._view.tsIndexes.length; i < iz; ++i) {
        if (that._suppressMemoryUsage) {
            if (that._connections >= that._maxConnections) {
                break;
            }
        }
        var tsIndex = that._view.tsIndexes[i];
        var ts      = that._tsMap[tsIndex]; // { index, url, state, duration, startTime, endTime, created_at, updated_at }

        if (ts["state"] === STATE_NEW) {
            ts["state"] = STATE_LOADING;

            ++that._connections;
            _load(that, tsIndex, _onloaded);
        }
    }

    function _onloaded(url, tsIndex, blob) {
        if (--that._connections < 0) {
            that._connections = 0;
        }
        that._tsCallback(url, tsIndex, blob);
        if (that._cachedDuration >= that._durationThreshold) {
            that._overthresholdCallback(that._cachedDuration);
        }
    }
}

function _load(that, tsIndex, loadedCallback) {
    // @desc ts ファイルをBlobとして読み込み、blobMapに蓄える, _cachedDuration を更新する
    var tsMap = that._tsMap;
    var url = tsMap[tsIndex]["url"];

    FileLoader["loadBlob"](url, function(blob) {
        if (tsIndex in tsMap) {
            var ts = tsMap[tsIndex];
            if (ts["state"] === STATE_LOADING) { // STATE_LOADING -> STATE_BLOB_CACHED
                ts["state"] = STATE_BLOB_CACHED;
                ts["updated_at"] = Date.now();

                that._blobMap[tsIndex] = blob; // cache
                that._cachedDuration = _calcPlayableDuration.call(that); // update

                if (M3U8VODSpooler["VERBOSE"]) {
                    console.info("BLOB CACHED", { "tsIndex": tsIndex, "duration": ts["duration"] });
                }
                if (loadedCallback) {
                    loadedCallback(url, tsIndex, blob);
                }
            }
        }
    }, function(error) {
        tsMap[tsIndex]["state"]      = STATE_ERROR;
        tsMap[tsIndex]["updated_at"] = Date.now();
        console.error("ERROR", {
            "tsIndex":  tsIndex,
            "message":  error.message,
        });
        if (error.message === "TIMEOUT") {
            if (that._errorCallback) {
                that._errorCallback({ "type": "timeout", "detail": { "url": url, "code": 408 } });
            }
        } else {
            if (that._errorCallback) {
                that._errorCallback({ "type": "error", "detail": { "url": url, "code": 404 } });
            }
        }
    });
}

function _calcPlayableDuration() { // @ret UINT32
    // view.cursor から再生可能(STATE_BLOB_CACHED)な連続したtsを探し、それらの合計を返す
    //
    //  N = STATE_NEW, L = STATE_LOADING, C = STATE_BLOB_CACHED, B = STATE_BLOB_RESERVED, R = STATE_RELEASED, E = STATE_ERROR
    //
    //  例: ts[0]がまだcacheされていない -> 0 を返す
    //
    //      ts[0] ts[1] ts[2] ts[3] ts[4]
    //      +----++----++----++----++----+
    //      | L  || C  || C  || C  || C  |
    //      +----++----++----++----++----+
    //
    //  例: ts[2]がまだcacheされていない -> ts[0].duration + ts[1].duration を返す(ts[3].durationは含まない)
    //
    //      ts[0] ts[1] ts[2] ts[3] ts[4]
    //      +----++----++----++----++----+
    //      | C  || C  || N  || C  || C  |
    //      +----++----++----++----++----+
    //
    //  例: ts[0]とts[1]が使用済み -> ts[2].duration + ts[3].duration を返す
    //
    //      ts[0] ts[1] ts[2] ts[3] ts[4]
    //      +----++----++----++----++----+
    //      | B  || B  || C  || C  || N  |
    //      +----++----++----++----++----+
    //
    //  例: ts[0]とts[1]がリリース済み -> ts[2].duration + ts[3].duration を返す
    //
    //      ts[0] ts[1] ts[2] ts[3] ts[4]
    //      +----++----++----++----++----+
    //      | R  || R  || C  || C  || N  |
    //      +----++----++----++----++----+
    var duration = 0;

    for (var i = this._view.cursor, iz = this._view.tsIndexes.length; i < iz; ++i) {
        var tsIndex = this._view.tsIndexes[i];
        var ts      = this._tsMap[tsIndex]; // { index, url, state, duration, startTime, endTime }

        if (ts["state"] === STATE_NEW ||     // 検索終了 -> ここまでの duration を返す
            ts["state"] === STATE_LOADING) {
            return duration;
        }
        if (ts["state"] === STATE_BLOB_CACHED) { // 検索続行
            duration += ts["duration"];
        }
    }
    return duration;
}

function _dumpStream(playlist) {
    for (var i = 0, iz = playlist.stream.length; i < iz; ++i) {
        console.info("VOD PLAYLIST", {
            "index":    playlist.stream[i]["index"],
            "duration": playlist.stream[i]["duration"]
        });
    }
}

function _toStateString() {
    var stateArray = [];

    for (var i = 0, iz = this._view.tsIndexes.length; i < iz; ++i) {
        var tsIndex = this._view.tsIndexes[i];

        if (tsIndex in this._tsMap) {
            var ts = this._tsMap[tsIndex]; // { index, url, state, duration, startTime, endTime }
            var m = "";

            switch (ts["state"]) {
            case STATE_NEW:             m = "N"; break;
            case STATE_LOADING:         m = "L"; break;
            case STATE_BLOB_CACHED:     m = "C"; break;
            case STATE_BLOB_RESERVED:   m = "B"; break;
            case STATE_RELEASED:        m = "R"; break;
            case STATE_ERROR:           m = "E"; break;
            }
            if (this._view.cursor === i) {
                m = m.toLowerCase();
            }
            stateArray.push(m);
        }
    }
    return stateArray.join("");
}

function _countQueueState() { // @ret Object - { STATE_NEW, STATE_LOADING, STATE_BLOB_CACHED, STATE_BLOB_RESERVED, STATE_RELEASED, STATE_ERROR }
    var result = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; // { STATE_NEW: 0, ... }

    for (var i = 0, iz = this._view.tsIndexes.length; i < iz; ++i) {
        var tsIndex = this._view.tsIndexes[i];

        if (tsIndex in this._tsMap) {
            var ts = this._tsMap[tsIndex]; // { index, url, state, duration, startTime, endTime }

            result[ts["state"]]++;
        }
    }
    return result;
}

return M3U8VODSpooler; // return entity

});

