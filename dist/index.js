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
        /**
         * Created by Ivan on 18.11.2016.
         */
        "use strict";

        var handler = function handler(once, eventName) {
            return function () {
                for (var _len = arguments.length, fns = Array(_len), _key = 0; _key < _len; _key++) {
                    fns[_key] = arguments[_key];
                }

                var handlersList = this.subscriptions[eventName] || [],
                    newHandlers = fns.map(function (func) {
                    return { func: func, once: once };
                });
                this.subscriptions[eventName] = handlersList.concat(newHandlers);
                return this;
            };
        };

        function Observable() {
            this.subscriptions = {};
        }

        Observable.prototype.constructor = Observable;

        Observable.prototype.emit = function (eventName) {
            var _this = this;

            for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                args[_key2 - 1] = arguments[_key2];
            }

            var handlersList = this.subscriptions[eventName];
            if (!handlersList) return this;
            handlersList.forEach(function (handler) {
                handler.func.apply(_this, args);
                if (handler.once) _this.unbind(eventName, handler.func);
            });
            return this;
        };

        Observable.prototype.on = function (eventName) {
            for (var _len3 = arguments.length, fns = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
                fns[_key3 - 1] = arguments[_key3];
            }

            return handler(false, eventName).apply(this, fns);
        };

        Observable.prototype.once = function (eventName) {
            for (var _len4 = arguments.length, fns = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
                fns[_key4 - 1] = arguments[_key4];
            }

            return handler(true, eventName).apply(this, fns);
        };

        Observable.prototype.unbind = function (eventName) {
            for (var _len5 = arguments.length, fns = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
                fns[_key5 - 1] = arguments[_key5];
            }

            var handlersList = this.subscriptions[eventName];
            if (!handlersList) return this;

            fns.length > 0 ? this.subscriptions[eventName] = handlersList.filter(function (listener) {
                return !fns.includes(listener.func);
            }) : delete this.subscriptions[eventName];

            return this;
        };

        Observable.prototype.unbindAll = function () {
            this.subscriptions = [];
            return this;
        };

        if (typeof module !== 'undefined' && module.exports) {
            module.exports = Observable;
        }
        if (typeof window !== 'undefined' && document) {
            window.Observable = Observable;
        }
    }, {}], 2: [function (require, module, exports) {
        /**
         * Created by Ivan on 02.02.2017.
         * AsyncBuffer constructor;
         * It is used for accumulation of async tasks and calling them sequentially after AsyncBuffer limit will be exceeded;
         */
        "use strict";

        var Observable = require('@nodeart/observable');

        function AsyncBuffer() {
            var AsyncBufferLimit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 50;
            var autoStart = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

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

        AsyncBuffer.prototype.push = function () {
            for (var _len6 = arguments.length, tasks = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
                tasks[_key6] = arguments[_key6];
            }

            this.stack = this.stack.concat(tasks);
            if (this.stack.length >= this.limit) {
                this.autostart ? this.drainBuffer() : this.emit('stack_filled');
            }
            return this;
        };

        AsyncBuffer.prototype.drainBuffer = function () {
            if (!this.process && this.stack.length > 0) {
                this.stopped = false;
                this.process = true;
                this.emit('start');
                this.pop();
            }
            return this;
        };

        AsyncBuffer.prototype.pop = function () {
            var _this2 = this;

            var callback = function callback(result) {
                _this2.results.push(result);
                if (_this2.stack.length > 0) {
                    if (_this2.stopped) {
                        _this2.process = false;
                        _this2.emit('stop', _this2.results);
                    } else {
                        _this2.pop();
                    }
                } else {
                    _this2.process = false;
                    _this2.emit('drain', _this2.results);
                    _this2.results = [];
                }
            };

            var res = this.results;

            this.stack.pop()(callback, res[res.length - 1]);
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
    }, { "@nodeart/observable": 1 }] }, {}, [2]);