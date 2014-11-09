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

Template.bookmark_labels.events = {
  'click .bookmark-label': function (event) {
    var $target = $(event.target);
    if ($target.hasClass('active')) {
      return;
    } else {
      $('.bookmark-label a').removeClass('active');
      $target.addClass('active');
      var bookmarkId = $target.data('bookmark-id');
      Session.set('bookmarkId', bookmarkId);
      Session.set('searchOptions', null);
      waartaa.bookmarks.helpers.getBookmarkedItems(bookmarkId);
    }
  }
};
