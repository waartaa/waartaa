Router.map(function () {

  this.route('bookmarks', {
    where: 'server',
    path: '/api/bookmarks',
    controller: BookmarksController
  });

});
