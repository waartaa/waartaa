waartaa.bookmarks.helpers = {
  getBookmarkedItems: function (logTimestamp, channel_name, server_name) {
    console.log(channel_name);
    var API_URL = waartaa.bookmarks.API_ENDPOINT;
    Meteor.http.post(API_URL, {
      data: {
        logTimestamp: logTimestamp,
        channel_name: channel_name,
        server_name: server_name
      }
    }, function (err, resp) {
      if (!err && resp.data.status) {
        waartaa.bookmarks.helpers.renderResponse(resp.data.data);
      } else {
        alert('An error occured while fetching data');
      }
    });
  },

  renderResponse: function (data) {
  }
};
