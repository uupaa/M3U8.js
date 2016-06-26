(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("M3U8Loader", function moduleClosure(global, WebModule, VERIFY, VERBOSE) {
"use strict";

// --- technical terms / data structure --------------------
// --- dependency modules ----------------------------------
var Task          = WebModule["Task"];
var FileLoader    = WebModule["FileLoader"];
// --- import / local extract functions --------------------
// --- define / local variables ----------------------------
var TICK_INTERVAL = 100;
var JOB_WAIT      = 0; // Job 投入待ち(unlocked)
var JOB_RUNNING   = 1; // Job 投入中(unlocked -> locked)
var JOB_FINISHED  = 2; // Job 完了(locked -> unlocked)
var JOB_CANCELED  = 3; // cancel() が実行された状態
var JOB_ERROR     = 4; // Job 失敗(デコードエラー or timeout)

// --- class / interfaces ----------------------------------
function M3U8Loader(queueLimit, // @arg UINT8 = 3
                    timeout) {  // @arg UINT32 = 5000 - ms
    queueLimit = queueLimit || 3;

    this._jobIndex = 0;
    this._jobArray = []; // [ job, ... ]
    this._timeout  = timeout || 5000;
    this._tickfn   = _tick.bind(this);
    this._lockedState = [];

    for (var i = 0, iz = queueLimit; i < iz; ++i) {
        this._lockedState[i] = false; // set unlock
    }
}

M3U8Loader["VERBOSE"] = VERBOSE;
M3U8Loader["prototype"] = Object.create(M3U8Loader, {
    "constructor":  { "value": M3U8Loader          }, // new M3U8Loader(...):M3U8Loader
    "add":          { "value": M3U8Loader_add      }, // M3U8Loader#add(baseURL, stream, readyCallback, errorCallback):void
    "clear":        { "value": M3U8Loader_clear    }, // M3U8Loader#clear():void
});

// --- implements ------------------------------------------
function M3U8Loader_add(baseURL,         // @arg URLString
                        stream,          // @arg IndexPlaylistStreamObjectArray - [{ index, url, duration, title }, ...]
                        readyCallback,   // @arg Function - readyCallback(blobURL:BlobURL, streamIndexes:StreamIndexUINT32Array, totalDuration:UINT32):void
                        errorCallback) { // @arg Function = null - errorCallback(error:Error, streamIndexes:StreamIndexUINT32Array, totalDuration:UINT32):void
    var streamIndexes = [];
    var totalDuration = 0;

    for (var i = 0, iz = stream.length; i < iz; ++i) {
        streamIndexes.push( stream[i]["index"] );
        totalDuration += stream[i]["duration"];
    }

    var job = {
        jobIndex:       ++this._jobIndex,
        baseURL:        baseURL,
        startTime:      Date.now(),
        streamIndexes:  streamIndexes,
        totalDuration:  totalDuration,
        stream:         stream.slice(), // copy
        state:          JOB_WAIT,       // JOB_WAIT -> JOB_RUNNING -> JOB_FINISHED/JOB_ERROR
        readyCallback:  readyCallback,
        errorCallback:  errorCallback,
    };

    this._jobArray.push(job); // add job

    if (this._jobArray.length === 1) {
        this._tickfn();
    }
}

function _tick() {
    var that = this;

    if (this._jobArray.length) {
        setTimeout(this._tickfn, TICK_INTERVAL);

        if (this._lockedState.indexOf(false) >= 0) {
            this._lockedState.forEach(function(locked, lockIndex) {
                if (locked) { return; }
                var job = _findJob.call(that); // JobObject|null

                if (job) {
                    _lock.call(that, lockIndex);
                    job.state = JOB_RUNNING;   // update job state. JOB_WAIT -> JOB_RUNNING

                    _download(that, lockIndex, job.baseURL, job.stream, job.streamIndexes, job.totalDuration, function(blobURL, streamIndexes, totalDuration) {
                        switch (job.state) {
                        case JOB_RUNNING:   // download完了が完了したら state を JOB_WAIT から JOB_RUNNING に遷移させ unlock する
                                            // job.readyCallback を発火させる
                            job.state = JOB_FINISHED; // JOB_RUNNING -> JOB_FINISHED
                            _unlock.call(that, lockIndex);
                            job.readyCallback(blobURL, streamIndexes, totalDuration);
                            break;
                        case JOB_CANCELED: // download完了を待っている間に cancel された場合は
                                           // job.state は JOB_CANCELED になっている
                                           // job.readyCallback または job.errorCallback は発火させない
                            _unlock.call(that, lockIndex);
                        }
                        _garbageJob.call(that);
                    }, function(error, streamIndexes, totalDuration) { // @arg Error - { message, code }
                        // download 失敗(404 や timeout など)した場合は、state を JOB_ERROR に遷移させ unlock する
                        // job.errorCallback を発火させる
                        console.error(error.message);

                        job.state = JOB_ERROR;
                        _unlock.call(that, lockIndex);
                        job.errorCallback(error, job.streamIndexes, totalDuration);
                        _garbageJob.call(that);
                    });
                }
            });
        }
    }
}

function _download(that,            // @arg this
                   lockIndex,       // @arg UINT8
                   baseURL,         // @arg URLString
                   stream,          // @arg IndexPlaylistStreamObjectArray - [{ url, ... }, ...]
                   streamIndexes,   // @arg UINT32Array - [stream.index, ...]
                   totalDuration,   // @arg UINT32
                   readyCallback,   // @arg Function - readyCallback(blobURL:BlobURLString):void
                   errorCallback) { // @arg Function - errorCallback(error:Error):void

    var task = new Task("", stream.length, function(error, buffer) {
        if (error) {
            errorCallback(error, streamIndexes, totalDuration);
        } else {
            var blob = new Blob(buffer, { "type": "video/mp2ts" });
            var blobURL = URL.createObjectURL(blob);

            readyCallback(blobURL, streamIndexes, totalDuration);
        }
    });

    stream.forEach(function(obj) { // @arg IndexPlaylistStreamObjectArray - [{ url, ... }, ...]
        var url = baseURL + obj["url"];

        FileLoader["loadArrayBuffer"](url, function(arrayBuffer) { // @arg ArrayBuffer
            task["buffer"].push( new Uint8Array(arrayBuffer) );
            task["pass"]();
        }, function(error) {
            task["done"](error); // task.miss + set error
        }, { timeout: that._timeout });
    });
}

function _lock(lockIndex) { // @arg UINT8
    if (!this._lockedState[lockIndex]) {
        this._lockedState[lockIndex] = true;
    }
}

function _unlock(lockIndex) { // @arg UINT8
    if (this._lockedState[lockIndex]) {
        this._lockedState[lockIndex] = false;
    }
}

function _findJob() { // @ret JobObject - JOB_WAIT
    for (var i = 0, iz = this._jobArray.length; i < iz; ++i) {
        var job = this._jobArray[i];

        if (job) {
            if (job.state === JOB_WAIT) {
                return job;
            }
        }
    }
    return null;
}

function _garbageJob() {
    if (this._jobArray.length) {
        var now = Date.now();
        var newDenceQueue = [];

        for (var i = 0, iz = this._jobArray.length; i < iz; ++i) {
            var job = this._jobArray[i];

            if (job) {
                switch (job.state) {
                case JOB_WAIT:
                    newDenceQueue.push(job);
                    break;
                case JOB_RUNNING:
                    if (this._timeout && now >= job.startTime + this._timeout) {
                        // timeout -> remove job
                    } else {
                        newDenceQueue.push(job);
                    }
                }
            }
        }
        this._jobArray = newDenceQueue;
    }
}

function M3U8Loader_clear() {
    for (var i = 0, iz = this._jobArray.length; i < iz; ++i) {
        var job = this._jobArray[i];

        if (job.state === JOB_WAIT || job.state === JOB_RUNNING) {
            job.state = JOB_CANCELED;
        }
    }
}

return M3U8Loader; // return entity

});


