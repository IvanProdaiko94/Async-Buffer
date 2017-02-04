**AsyncBuffer** 

AsyncBuffer is used for async tasks accumulation and calling them sequentially after buffer limit will be exceeded.
AsyncBuffer starts its operation automatically just task limit is reached.

For example one can use this package to work with database.
Imagine you can use http server working and on each request you must push some info to database.
Instead of doing it each time you can push task to buffer and writing to database will start after limit is exceeded.

Each task is provided with callback as first parameter. It must be called to proceed operation.
You can optionally pass a parameter to the callback and it will be treated as a result of the task and stored inside `results` array.
Second parameter in task is result if previous task (if no parameter provided `null` will be pushed to `results` array).
Default stack capacity is 50 tasks.

Basic usage:
```javascript
let buffer = new AsyncBuffer(4);

buffer.on('drain', function (results) {
    console.log('I was drained', results);
});

buffer.push(function(cb) {
    setTimeout(function () {
        console.log(`I was called times`);
        cb('result');
    }, 1000)
});
```

It is necessary to mention that tasks execution is started asynchronously using `setTimeout(fn, 0)` to be pushed in the end of queue. 

`push` method supports multiple parameters, so you can provide several tasks like so:
```javascript
let buffer = new AsyncBuffer(),
    task = function(cb) {
               setTimeout(function () {
                   console.log(`I was called times`);
                   cb('result');
               }, 1000)
           }
buffer.push(task, task, task);
```

or by using of `apply`
```javascript
buffer.push(buffer, [task, task, task]);
```

Also you there is two events that are used to notify about starting and ending of operation (`'start'` and `'drain'` respectively).
`'drain'` event callback is provided with results of operation as a first parameter.
```javascript
x.on('start', function () {
    console.log('Execution is strted', );
});

x.on('drain', function (results) {
    console.log('I was drained', results);
}, function(results) {
    console.log('Really drained', resluts);
});
```

If you need to:

1. Start tasks execution before the limit will be exceeded use `drainBuffer` function.
2. Clear tasks stack use `clearTasksStack` function.
3. Drain buffer before process will exit you can use monkey patch provided in this package like that:
```javascript
monkeyPatch(function (exit) {
    return function () {
        x.on('drain', () => exit());
        x.drainAsyncBuffer();
    }
});
```