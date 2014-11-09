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
        waartaa.search.helpers.renderResponse(body, 'search');
      } else {
        alert('OOPS! An error occured while fetching data.');
      }
      $('.chatlogs-loader-msg').fadeOut(500);
    });
  },

  renderResponse: function (response, type) {
    if (type == 'search') {
      $('.bookmark-label a').removeClass('active');
    }
    var data = response.data;
    if (data.status) {
      var results = data.results;
      Session.set('searchResult', results);
      Session.set('searchErrors', null);
      $('#search-errors').hide();
      $('#search-chat-logs').show();
    } else {
      Session.set('searchResult', null);
      Session.set('searchErrors', data.errors);
      $('#search-chat-logs').hide();
      $('#search-errors').show();
    }
    $('#search-results').show();
  }
};

var _getCurrentPage = function () {
  var result = Session.get('searchResult');
  if (result && result.page) {
    return result.page;
  }
  return 0;
};

var _getTotalPages = function () {
  var result = Session.get('searchResult');
  if (result && result.perPage && result.totalCount) {
    var perPage = result.perPage;
    var totalCount = result.totalCount;
    var count = parseInt(totalCount / perPage);
    if ((totalCount % perPage) > 0)
      count += 1;
    return count;
  }
  return 0;
}

Template.search.helpers({
  stripChannelHash: function (channelName) {
    if (channelName && channelName[0] == '#') {
      return channelName.substring(1, channelName.length);
    }
  },

  /*
   * Returns search results total count.
   */
  totalCount: function () {
    var result = Session.get('searchResult');
    if (result && result.totalCount>=0) {
      return result.totalCount;
    }
  },

  /*
   * Returns time taken by search in seconds.
   */
  took: function () {
    var result = Session.get('searchResult');
    if (result && result.took) {
      return result.took/1000;
    }
  },

  /*
   * Returns channel logs found.
   */
  logs: function () {
    var result = Session.get('searchResult');
    if (result && result.logs) {
      return result.logs;
    }
  },

  /**
   * Return current page in search result
   */
  currentPage: function () {
    return _getCurrentPage();
  },

  /**
   * Return total pages in search result
   */
  totalPages: function () {
    return _getTotalPages();
  },

  /**
   * Return errors in search result
   */
  errors: function () {
    var errors = Session.get('errors');
    if (errors)
      return errors;
  },

  showNextButton: function () {
    var currentPage = _getCurrentPage();
    var totalPages = _getTotalPages();
    if (currentPage < totalPages)
      return true;
    else
      return false;
  },

  showPreviousButton: function () {
    var currentPage = _getCurrentPage();
    if (currentPage > 1)
      return true;
    else
      return false;
  }
});
