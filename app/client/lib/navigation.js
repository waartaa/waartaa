navManager = function () {
  var prevRouter, currentRouter;

  function _isSamePage(newRouter, oldRouter) {
      var newPagePath = newRouter && newRouter.url.split('?')[0];
      var oldPagePath = oldRouter && oldRouter.url.split('?')[0];
      if (newPagePath == oldPagePath)
        return true;
      return false;
  }

  return {
    set: function () {
      if (!currentRouter || currentRouter.url != Router.current().url) {
        prevRouter = currentRouter;
        currentRouter = Router.current();
      }
    },
    isSamePage: function (newRouter) {
      return _isSamePage(newRouter, currentRouter);
    },
    isNewPage: function () {
      return !_isSamePage(currentRouter, prevRouter);
    },
    echo: function () {
      console.log('prevRouter', prevRouter);
      console.log('currentRouter', currentRouter);
    },
    isFirstPage: function () {
      if (!prevRouter)
        return true;
      return false;
    }
  }
}();