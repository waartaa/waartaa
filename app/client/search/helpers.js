waartaa.search.helpers = {
  getAPIEnpoint: function (serverName, channelName, getParams) {
    var API_URL = waartaa.search.API_ENDPOINT;
    if (serverName && channelName) {
      API_URL += encodeURIComponent(serverName) + '/';
      API_URL += encodeURIComponent(channelName) + '/';
    }
    if (!$.isEmptyObject(getParams)) {
      API_URL += '?';
      for (var key in getParams) {
        if(getParams[key])
          API_URL += key + '=' + encodeURIComponent(getParams[key]) + '&';
      }
      API_URL = API_URL.substring(0, API_URL.length - 1);
    }
    return API_URL;
  },

  callAPI: function (serverName, channelName, getParams) {
    var API_URL = this.getAPIEnpoint(serverName, channelName, getParams);
    $('.chatlogs-loader-msg').show();
    Meteor.http.get(API_URL, function (err, body) {
      if (!err) {
        waartaa.search.helpers.renderResponse(body);
      } else {
        alert('OOPS! An error occured while fetching data.');
      }
      $('.chatlogs-loader-msg').fadeOut(500);
    });
  },

  renderResponse: function (response) {
    var data = response.data;
    if (data.status) {
      var results = data.results;
      var chatHTML = UI.toHTML(Template.search_chat_logs.extend({
        data: function () {
          return results.data;
        }
      }));
      // decode html trick
      // decoded highlighted search terms
      chatHTML = $('<textarea />').html(chatHTML).val();
      $('#search-errors').hide();
      $('#chat-logs .logs').html(chatHTML);
      $('#chat-logs .results-count').html('About ' + results.totalCount + ' result(s) in ' + results.took/1000 + ' seconds');
      $('#chat-logs').show();
    } else {
      var errors = data.errors;
      var errorHTML = UI.toHTML(Template.search_errors.extend({
        data: function () {
          return errors;
        }
      }));
      $('#chat-logs').hide();
      $('#search-errors .errors').html(errorHTML);
      $('#search-errors').show();
    }
    $('#search-results').show();
  }
};

Template.search.helpers({
  stripChannelHash: function (channelName) {
    if (channelName && channelName[0] == '#') {
      return channelName.substring(1, channelName.length);
    }
  }
});
