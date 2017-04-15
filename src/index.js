/**
 * Created by Ivan on 02.02.2017.
 * AsyncBuffer constructor;
 * It is used for accumulation of async tasks and calling them sequentially after AsyncBuffer limit will be exceeded;
 */
"use strict";
const EventEmitter = require('@nodeart/event_emitter');

function AsyncBuffer(AsyncBufferLimit, autoStart = true) {
    if (!AsyncBufferLimit || typeof AsyncBufferLimit !== 'number') {
        throw new Error('AsyncBufferLimit is required!');
    }
    this.limit = AsyncBufferLimit;
    this.autostart = autoStart;
    this.stack = [];
    this.results = [];
    this.stopped = false;
    this.process = false;
    EventEmitter.call(this);
}

AsyncBuffer.prototype = EventEmitter.prototype;
AsyncBuffer.prototype.constructor = AsyncBuffer;

AsyncBuffer.prototype.push = function (...tasks) {
    this.stack = this.stack.concat(tasks);
    if (this.stack.length >= this.limit) {
        this.autostart ? this.drainBuffer() : this.emit('stack_filled', this);
    }
    return this;
};

AsyncBuffer.prototype.drainBuffer = function () {
    if (!this.process && this.stack.length > 0) {
        const callback = result => {
            this.results.push(result);
            if (this.stack.length > 0) {
                if (this.stopped) {
                    this.process = false;
                    this.emit('stop', this, this.results);
                } else {
                    this.pop(callback);
                }
            } else {
                this.process = false;
                this.emit('drain', this, this.results);
                this.results = [];
            }
        };
        this.stopped = false;
        this.process = true;
        this.emit('start', this);
        this.pop(callback);
    }
    return this;
};

AsyncBuffer.prototype.drainBufferParallel = function () {
    if (!this.process && this.stack.length > 0) {
        let results = [],
            count = this.stack.length,
            callback = index => result => {
                results[index] = result;
                count -= 1;
                if (count === 0) {
                    this.process = false;
                    this.emit('chunk_done', this, results);
                    this.stopped ?
                        this.emit('stop', this, result) :
                        this.drainBufferParallel();
                    if (this.stack.length === 0) {
                        this.emit('drain', this, results);
                    }
                }
            };
        this.stopped = false;
        this.process = true;
        this.emit('start', this);
        for (let i = this.stack.length - 1; i >= 0; i--) {
            this.stack.pop()(callback(i));
        }
    }
    return this;
};

AsyncBuffer.prototype.pop = function (callback) {
    let res = this.results,
        task = this.stack.pop();
    task(callback, res[res.length - 1]);
    return this;
};

AsyncBuffer.prototype.clearTasksStack = function () {
    this.stack = [];
    return this;
};

AsyncBuffer.prototype.stopExecution = function () {
    this.stopped = true;
    return this;
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AsyncBuffer;
}
if (typeof window !== 'undefined' && document) {
    window.AsyncBuffer = AsyncBuffer;
}