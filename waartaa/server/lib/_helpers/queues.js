enqueueTask = function (queue, func, timeout) {
    var timeout = timeout || CONFIG.DEFAULT_ASYNC_TASK_TIMEOUT || 5000;
    queue.add(function (done) {
        var timeoutId = Meteor.setTimeout(function () {
            done();
        }, timeout);
        Fiber(function () {
            func();
            done();
            Meteor.clearTimeout(timeoutId);
        }).run();
    });
};