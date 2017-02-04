/**
 * Created by Ivan on 02.02.2017.
 * AsyncBuffer constructor;
 * It is used for accumulation of async tasks and calling them sequentially after AsyncBuffer limit will be exited;
 */
"use strict";
const Observable = require('@nodeart/observable');

function AsyncBuffer(AsyncBufferLimit) {
    this.stack = [];
    this.results = [];
    this.limit = AsyncBufferLimit;
    this.process = false;
    Observable.call(this);
}

AsyncBuffer.prototype = Observable.prototype;
AsyncBuffer.prototype.constructor = AsyncBuffer;

AsyncBuffer.prototype.callback = function (result = null) {
    this.results.push(result);
    this.stack.length > 0 ? this.pop() : this.emit('drain', this.results);
    this.process = false;
};

AsyncBuffer.prototype.push = function (...tasks) {
    this.stack = this.stack.concat(tasks);
    if (this.stack.length >= this.limit) {
        setTimeout(() => this.drainAsyncBuffer(), 0);
    } else if (this.stack.length >= 1000) {
        setImmediate(() => this.drainAsyncBuffer());
    }
};

AsyncBuffer.prototype.drainAsyncBuffer = function () {
    if (!this.process) {
        this.emit('start');
        this.pop();
        this.process = true;
    }
};

AsyncBuffer.prototype.pop = function () {
    let task = this.stack.pop(),
        res = this.results;
    if (typeof task === 'function') {
        task(this.callback.bind(this), res[res.length - 1]);
    } else {
        throw new Error('task must be a function')
    }
};

module.exports = AsyncBuffer;