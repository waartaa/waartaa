Router.map(function () {

  this.route('search', {
    where: 'server',
    path: '/api/search/:server_name/:channel_name',
    controller: SearchController
  });

});
