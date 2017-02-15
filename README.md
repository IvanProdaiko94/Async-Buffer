**AsyncBuffer** 

AsyncBuffer is used for async tasks accumulation and calling them sequentially after buffer limit will be exceeded.
By default AsyncBuffer starts its operation automatically just after tasks limit is reached.
AsyncBuffer can be used in browser as well as in Node.

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
}).push(function(cb) {
    setTimeout(function () {
        console.log(`I was called times`);
        cb('result');
    }, 1000)
});
```

You can switch off auto execution by setting second parameter in constructor to `false` and start task execution manually.
Also `push` method supports multiple parameters, so you can provide several tasks like so:
```javascript
let buffer = new AsyncBuffer(5, false),
    task = function(cb) {
               setTimeout(function () {
                   console.log(`I was called`);
                   cb('result');
               }, 1000)
           };
buffer.on('stack_filled', function () {
    console.log('Stack is filled');
    buffer.drainBuffer();
}).push(task, task, task, task, task);
```
or by using of `apply`
```javascript
buffer.push(buffer, [task, task, task]);
```
Also you there is two events that are used to notify about starting and ending of operation (`'start'` and `'drain'` respectively).
`'drain'` event callback is provided with results of operation as a first parameter.
```javascript
buffer.on('start', ()      => console.log('Execution is started'))
      .on('drain', results => console.log('I was drained', results), 
                   results => console.log('Really drained', results));
```
Also you can use `drainBufferParallel` method to replace sequential execution with parallel.
After execution `chunk_done` event will be emitted and if no tasks were added during process `drain` event will be emitted as well.

Example:
```
buffer.on('stop', () => console.log('stop'));
buffer.on('stack_filled', () => console.log('stack_filled'));
buffer.push(task, task, task, task, task)
      .drainBuffer()
      .once('drain', res => {
    console.log('drained', res);
    buffer.push(task, task, task, task, task)
          .drainBufferParallel()
          .push(task, task, task, task, task)
          //.stopExecution()
          .on('chunk_done', res => console.log('chunk_done', res));
});
```

If you need to:

1. Start tasks execution before the limit will be exceeded or if second parameter in constructor was `false` use `drainBuffer` function.
2. Clear tasks stack use `clearTasksStack` function.
3. Stop execution at some moment of time use `stopExecution` function. Buffer will handle all tasks that was executed, but will not trigger next. Example:
```javascript
buffer.on('stop', function(currentResults) {
    console.log(`Execution has been stopped. Here is results ${currentResults}`);
    //continue execution
    buffer.drainBuffer();
})
```
4. Drain buffer before process will exit you can use monkey patch provided in this package like that:
```javascript
monkeyPatch(function (exit) {
    return function () {
        buffer.on('drain', () => exit())
              .drainBuffer();
    }
});
```