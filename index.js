/**
 * Created by Ivan on 02.02.2017.
 * AsyncBuffer constructor;
 * It is used for accumulation of async tasks and calling them sequentially after AsyncBuffer limit will be exited;
 */
"use strict";
const Observable = require('@nodeart/observable');

function AsyncBuffer(AsyncBufferLimit) {
    this.stack = [];
    this.limit = AsyncBufferLimit;
    this.process = false;
    this.results = [];
    Observable.call(this);
}

AsyncBuffer.prototype = Observable.prototype;
AsyncBuffer.prototype.constructor = AsyncBuffer;

AsyncBuffer.prototype.callback = function (result) {
    if (result) this.results.push(result);
    this.stack.length > 0 ? this.pop() : this.emit('drain', this.results).process = false;
    return this;
};

AsyncBuffer.prototype.push = function (...tasks) {
    this.stack = this.stack.concat(tasks);
    if (this.stack.length >= this.limit) {
        setTimeout(() => this.drainAsyncBuffer(), 0);
    } else if (this.stack.length >= 1000) {
        setImmediate(() => this.drainAsyncBuffer());
    }
    return this;
};

AsyncBuffer.prototype.drainAsyncBuffer = function () {
    let func = () => this.emit('start').pop();
    if (!this.process) {
        func();
        this.process = true;
    }
    return this;
};

AsyncBuffer.prototype.pop = function () {
    let task = this.stack.pop();
    if (typeof task === 'function') {
        task(this.callback.bind(this));
    }
    return this;
};

module.exports = AsyncBuffer;

let x = new AsyncBuffer(4),
    counter = 0;

x.on('drain', function (results) {
    console.log('I was drained', results);
});

for (let i = 0; i < 5; i++) {
    x.push(function(cb) {
        setTimeout(function () {
            counter += 1;
            console.log(`I was called ${counter} times`);
            cb(counter);
        }, 1000)
    });
}
