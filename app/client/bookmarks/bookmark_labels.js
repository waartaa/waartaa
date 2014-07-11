UI.registerHelper('myBookmarks', function () {
  var userId = Meteor.userId();
  var bookmarks = Bookmarks.find(
    {
      userId: userId
    },
    {
      sort: {created: -1}
    }
  );
  return bookmarks;
});

Template.bookmark_labels.rendered = function () {
  $('.nano').nanoScroller();
}

Template.bookmark_labels.events = {
  'click .bookmark-label': function (event) {
    var $target = $(event.target);
    var bookmarkId = $target.data('bookmark-id');
    var bookmark = Bookmarks.findOne({_id: bookmarkId});
    var logIds = bookmark.logIds;
    var channel_logs = [];
    for (var i=0; i<logIds.length; i++) {
      var logId = logIds[i];
      var esClient = new $.es.Client({
        host: 'localhost:9200'
      });
      esClient.get({
        index: 'channel_logs',
        type: 'log',
        id: logId
      }, function (error, response) {
        if (!error) {
          console.log(response);
        }
      });
      channel_logs.push(channel_log);
    }
    console.log(channel_logs);
  }
};
