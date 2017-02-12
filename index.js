/**
 * Created by Ivan on 02.02.2017.
 * AsyncBuffer constructor;
 * It is used for accumulation of async tasks and calling them sequentially after AsyncBuffer limit will be exceeded;
 */
"use strict";
const Observable = require('@nodeart/observable');

const AsyncBuffer = (function () {
    const callback = function (result) {
        this.results.push(result);
        if (this.stack.length > 0) {
            if (this.stopped) {
                this.process = false;
                this.emit('stop', this.results);
            } else {
                this.pop();
            }
        } else {
            this.process = false;
            this.emit('drain', this.results);
            this.results = [];
        }
    };

    function AsyncBuffer(AsyncBufferLimit = 50, autoStart = true) {
        this.limit = AsyncBufferLimit;
        this.autostart = autoStart;
        this.stack = [];
        this.results = [];
        this.stopped = false;
        this.process = false;
        Observable.call(this);
    }

    AsyncBuffer.prototype = Observable.prototype;
    AsyncBuffer.prototype.constructor = AsyncBuffer;

    AsyncBuffer.prototype.push = function (...tasks) {
        this.stack = this.stack.concat(tasks);
        if (this.stack.length >= this.limit) {
            this.autostart ? this.drainBuffer() : this.emit('stack_filled');
        }
    };

    AsyncBuffer.prototype.drainBuffer = function () {
        if (!this.process && this.stack.length > 0) {
            this.stopped = false;
            this.process = true;
            this.emit('start');
            this.pop();
        }
    };

    AsyncBuffer.prototype.pop = function () {
        let task = this.stack.pop(),
            res  = this.results;

        task(callback.bind(this), res[res.length - 1]);
    };

    AsyncBuffer.prototype.clearTasksStack = function () {
        this.stack = [];
    };

    AsyncBuffer.prototype.stopExecution = function () {
        this.stopped = true;
    };

    return AsyncBuffer;
})();