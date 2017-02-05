/**
 * Created by Ivan on 02.02.2017.
 * AsyncBuffer constructor;
 * It is used for accumulation of async tasks and calling them sequentially after AsyncBuffer limit will be exceeded;
 */
"use strict";
const Observable = require('@nodeart/observable');

function AsyncBuffer(AsyncBufferLimit = 50, autoStart = true, criticalLimit = 1000) {
    this.limit = AsyncBufferLimit;
    this.criticalLimit = criticalLimit;
    this.autostart = autoStart;
    this.stack = [];
    this.results = [];
    this.process = false;
    Observable.call(this);
}

AsyncBuffer.prototype = Observable.prototype;
AsyncBuffer.prototype.constructor = AsyncBuffer;

AsyncBuffer.prototype.callback = function (result = null) {
    this.results.push(result);
    if (this.stack.length > 0) {
        this.pop()
    } else {
        this.emit('drain', this.results);
        this.results = [];
    }
    this.process = false;
};

AsyncBuffer.prototype.push = function (...tasks) {
    this.stack = this.stack.concat(tasks);
    if (this.stack.length >= this.limit) {
        this.autostart ?
            setTimeout(() => this.drainBuffer(), 0) :
            this.emit('stack_filled');
    } else if (this.stack.length >= this.criticalLimit) {
        setImmediate(() => this.drainBuffer());
    }
};

AsyncBuffer.prototype.drainBuffer = function () {
    if (!this.process) {
        this.emit('start');
        this.pop();
        this.process = true;
    }
};

AsyncBuffer.prototype.pop = function () {
    let task = this.stack.pop(),
        res  = this.results;
    if (typeof task === 'function') {
        task(this.callback.bind(this), res[res.length - 1]);
    } else {
        throw new Error('task must be a function')
    }
};

AsyncBuffer.prototype.clearTasksStack = function () {
    this.stack = [];
};

module.exports = AsyncBuffer;