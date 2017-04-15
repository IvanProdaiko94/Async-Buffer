"use strict";

(function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);throw new Error("Cannot find module '" + o + "'");
            }var f = n[o] = { exports: {} };t[o][0].call(f.exports, function (e) {
                var n = t[o][1][e];return s(n ? n : e);
            }, f, f.exports, e, t, n, r);
        }return n[o].exports;
    }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
        s(r[o]);
    }return s;
})({ 1: [function (require, module, exports) {
        "use strict";

        var subscribe = function subscribe(once) {
            return function (eventName) {
                for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    args[_key - 1] = arguments[_key];
                }

                this.events[eventName] = args.reduce(function (acc, fn) {
                    acc.push({ fn: fn, once: once });
                    return acc;
                }, this.events[eventName] || []);
                return this;
            };
        },
            on = subscribe(false),
            once = subscribe(true);

        function EventEmitter() {
            this.events = {};
        }

        EventEmitter.prototype.on = function () {
            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            return on.apply(this, args);
        };

        EventEmitter.prototype.once = function () {
            for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                args[_key3] = arguments[_key3];
            }

            return once.apply(this, args);
        };

        EventEmitter.prototype.emit = function (eventName, ctx) {
            for (var _len4 = arguments.length, args = Array(_len4 > 2 ? _len4 - 2 : 0), _key4 = 2; _key4 < _len4; _key4++) {
                args[_key4 - 2] = arguments[_key4];
            }

            if (!this.events[eventName]) return this;
            this.events[eventName] = this.events[eventName].filter(function (elem) {
                elem.fn.apply(ctx, args);
                return !elem.once;
            });
            return this;
        };

        EventEmitter.prototype.off = function (eventName) {
            for (var _len5 = arguments.length, fns = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
                fns[_key5 - 1] = arguments[_key5];
            }

            if (!this.events[eventName]) return this;
            if (fns.length) {
                var tasksLeft = this.events[eventName].filter(function (listener) {
                    return !fns.includes(listener.fn);
                });
                if (tasksLeft.length) {
                    this.events[eventName] = tasksLeft;
                } else {
                    delete this.events[eventName];
                }
            } else {
                delete this.events[eventName];
            }
            return this;
        };

        EventEmitter.prototype.offAll = function () {
            this.events = {};
            return this;
        };

        if (typeof module !== 'undefined' && module.exports) {
            module.exports = EventEmitter;
        }
        if (typeof window !== 'undefined' && document) {
            window.EventEmitter = EventEmitter;
        }
    }, {}], 2: [function (require, module, exports) {
        /**
         * Created by Ivan on 02.02.2017.
         * AsyncBuffer constructor;
         * It is used for accumulation of async tasks and calling them sequentially after AsyncBuffer limit will be exceeded;
         */
        "use strict";

        var EventEmitter = require('@nodeart/event_emitter');

        function AsyncBuffer(AsyncBufferLimit) {
            var autoStart = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

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

        AsyncBuffer.prototype.push = function () {
            for (var _len6 = arguments.length, tasks = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
                tasks[_key6] = arguments[_key6];
            }

            this.stack = this.stack.concat(tasks);
            if (this.stack.length >= this.limit) {
                this.autostart ? this.drainBuffer() : this.emit('stack_filled', this);
            }
            return this;
        };

        AsyncBuffer.prototype.drainBuffer = function () {
            var _this = this;

            if (!this.process && this.stack.length > 0) {
                var callback = function callback(result) {
                    _this.results.push(result);
                    if (_this.stack.length > 0) {
                        if (_this.stopped) {
                            _this.process = false;
                            _this.emit('stop', _this, _this.results);
                        } else {
                            _this.pop(callback);
                        }
                    } else {
                        _this.process = false;
                        _this.emit('drain', _this, _this.results);
                        _this.results = [];
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
            var _this2 = this;

            if (!this.process && this.stack.length > 0) {
                var results = [],
                    count = this.stack.length,
                    callback = function callback(index) {
                    return function (result) {
                        results[index] = result;
                        count -= 1;
                        if (count === 0) {
                            _this2.process = false;
                            _this2.emit('chunk_done', _this2, results);
                            _this2.stopped ? _this2.emit('stop', _this2, result) : _this2.drainBufferParallel();
                            if (_this2.stack.length === 0) {
                                _this2.emit('drain', _this2, results);
                            }
                        }
                    };
                };
                this.stopped = false;
                this.process = true;
                this.emit('start', this);
                for (var i = this.stack.length - 1; i >= 0; i--) {
                    this.stack.pop()(callback(i));
                }
            }
            return this;
        };

        AsyncBuffer.prototype.pop = function (callback) {
            var res = this.results,
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
    }, { "@nodeart/event_emitter": 1 }] }, {}, [2]);