waartaa.bookmarks.helpers = {
  getBookmarkedItems: function (logTimestamp, channel_name, server_name) {
    var API_URL = waartaa.bookmarks.API_ENDPOINT;
    Meteor.http.post(API_URL, {
      data: {
        logTimestamp: logTimestamp,
        channel_name: channel_name,
        server_name: server_name
      }
    }, function (err, resp) {
      if (!err) {
        waartaa.search.helpers.renderResponse(resp);
      } else {
        alert('OOPS! An error occured while fetching data');
      }
    });
  },
};
