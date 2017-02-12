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

        var Observable = function () {
            function Observable() {
                Object.defineProperty(this, 'subscriptions', { value: {} });
            }

            Observable.prototype.constructor = Observable;

            Observable.prototype.getSubscriptions = function () {
                return this.subscriptions;
            };

            Observable.prototype.on = function (eventName) {
                for (var _len = arguments.length, fns = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    fns[_key - 1] = arguments[_key];
                }

                var handlersList = this.subscriptions[eventName] || [],
                    newHandlers = fns.map(function (func) {
                    if (typeof func === 'function') return { func: func, once: false };else throw new Error('Handler must be a function');
                });
                this.subscriptions[eventName] = handlersList.concat(newHandlers);
                return this;
            };

            Observable.prototype.once = function (eventName) {
                for (var _len2 = arguments.length, fns = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                    fns[_key2 - 1] = arguments[_key2];
                }

                var handlersList = this.subscriptions[eventName] || [],
                    newHandlers = fns.map(function (func) {
                    if (typeof func === 'function') return { func: func, once: true };else throw new Error('Handler must be a function');
                });
                this.subscriptions[eventName] = handlersList.concat(newHandlers);
                return this;
            };

            Observable.prototype.unbind = function (eventName) {
                for (var _len3 = arguments.length, fns = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
                    fns[_key3 - 1] = arguments[_key3];
                }

                var handlersList = this.subscriptions[eventName];
                if (!handlersList) return this;
                if (fns.length > 0) {
                    this.subscriptions[eventName] = handlersList.filter(function (listener) {
                        return !fns.includes(listener.func);
                    });
                } else {
                    delete this.subscriptions[eventName];
                }
                return this;
            };

            Observable.prototype.unbindAll = function () {
                this.subscriptions = [];
                return this;
            };

            Observable.prototype.emit = function (eventName) {
                var _this = this;

                for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
                    args[_key4 - 1] = arguments[_key4];
                }

                var handlersList = this.subscriptions[eventName];
                if (!handlersList) return this;
                handlersList.forEach(function (handler) {
                    handler.func.apply(_this, args);
                    if (handler.once) _this.unbind(eventName, handler.func);
                });
                return this;
            };

            return Observable;
        }();

        if (typeof module !== 'undefined' && module.exports) {
            module.exports = Observable;
        }
    }, {}], 2: [function (require, module, exports) {
        /**
         * Created by Ivan on 02.02.2017.
         * AsyncBuffer constructor;
         * It is used for accumulation of async tasks and calling them sequentially after AsyncBuffer limit will be exceeded;
         */
        "use strict";

        var Observable = require('@nodeart/observable');

        var callback = function callback(result) {
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
            for (var _len5 = arguments.length, tasks = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
                tasks[_key5] = arguments[_key5];
            }

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
            var task = this.stack.pop(),
                res = this.results;

            task(callback.bind(this), res[res.length - 1]);
        };

        AsyncBuffer.prototype.clearTasksStack = function () {
            this.stack = [];
        };

        AsyncBuffer.prototype.stopExecution = function () {
            this.stopped = true;
        };

        if (typeof module !== 'undefined' && module.exports) {
            module.exports = AsyncBuffer;
        }
        if (typeof window !== 'undefined' && document) {
            window.AsyncBuffer = AsyncBuffer;
        }
    }, { "@nodeart/observable": 1 }] }, {}, [2]);