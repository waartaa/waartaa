enqueueTask = function (queue, func, timeout) {
  Fiber(function () {
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
        logger.error(
          'queuedTaskError: %s', err, {traceback: err.stack});
        done();
        Meteor.clearTimeout(timeoutId);
      }
    });
  }).run();
};
