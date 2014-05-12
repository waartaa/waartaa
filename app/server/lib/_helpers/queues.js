enqueueTask = function (queue, func, timeout) {
    Fiber(function () {
        /*console.log(
            queue.title, queue.total(), queue.length(), queue.progress(),
            queue.usage(), func.toString());
        */
        var timeout = timeout || CONFIG.DEFAULT_ASYNC_TASK_TIMEOUT || 5000;
        queue.add(function (done) {
            try {
                var timeoutId = Meteor.setTimeout(function () {
                    done();
                }, timeout);
                Fiber(function () {
                    func();
                    done();
                    Meteor.clearTimeout(timeoutId);
                }).run();
            } catch (err) {
                console.log(err, err.stack);
                done();
                Meteor.clearTimeout(timeoutId);
            }
        });
    }).run();
};
