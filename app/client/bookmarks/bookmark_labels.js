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
    if ($target.hasClass('active')) {
      return;
    } else {
      $('.bookmark-label a').removeClass('active');
      $target.addClass('active');
      var bookmarkId = $target.data('bookmark-id');
      var bookmark = Bookmarks.findOne({_id: bookmarkId});
      var channel_name = bookmark.roomInfo.channel_name;
      var server_name = bookmark.roomInfo.server_name;
      var logTimestamp = bookmark.logTimestamp;
      waartaa.bookmarks.helpers.getBookmarkedItems(logTimestamp, channel_name, server_name);
      Session.set('bookmarkId', bookmarkId);
    }
  }
};
