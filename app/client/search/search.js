Template.search.servers = function () {
  return UserServers.find();
};

Template.search.channels = function (server_id) {
  var channels = UserChannels.find(
    {user_server_id: server_id, active: true},
    {
      fields: {last_updated: 0},
      sort: {name: 1}
    });
  return channels;
};

Template.search.rendered = function () {
  $('.chosen-select').chosen();
  $('.datepicker').datepicker({
    maxDate: 0,
    dateFormat: 'yy-mm-dd'
  });
};

var _callbackSearch = function () {
  var chosen = $('.chosen-select')[0];
  var selectedIndex = chosen.selectedIndex;
  var selectedEl = chosen.options[selectedIndex];
  var serverName = $(selectedEl).closest('optgroup').prop('label');
  var channelName = $('.chosen-select').val();
  var getParams = {
    message: $('#search-message').val(),
    from: $('#search-message-from').val(),
    to: $('#search-message-to').val(),
    dateFrom: $('#start-date').val(),
    dateTo: $('#end-date').val()
  };
  if(!channelName) {
    alert('Please select a channel');
    return;
  }
  Session.set('bookmarkId', null);
  Session.set('searchOptions', {
    serverName: serverName,
    channelName: channelName,
    getParams: getParams
  });
  waartaa.search.helpers.callAPI(serverName, channelName, getParams);
};

var _callbackNextPrev = function (page) {
  var bookmarkId = Session.get('bookmarkId');
  var searchOptions = Session.get('searchOptions');
  if (bookmarkId) {
    waartaa.bookmarks.helpers.getBookmarkedItems(bookmarkId, page);
  } else if (searchOptions) {
    var serverName = searchOptions.serverName;
    var channelName = searchOptions.channelName;
    var getParams = searchOptions.getParams;
    getParams.page = page;
    waartaa.search.helpers.callAPI(serverName, channelName, getParams);
  }
};

Template.search.events = {
  'click .advanced-options': function () {
    var active = $('.advanced-options').data('active');
    if (active) {
      $('.advance-options-field').slideUp();
      $('.advanced-options').text('Hide Options');
      $('.advanced-options').data('active', false);
    } else {
      $('.advance-options-field').slideDown();
      $('.advanced-options').text('More Options');
      $('.advanced-options').data('active', true);
    }
  },

  'click #search-button': function () {
    _callbackSearch();
  },

  'keyup #search-message': function (e) {
    if (e.keyCode == 13) {
      _callbackSearch();
    }
  },

  'click #previous-icon': function () {
    var currentPage = parseInt($('#page-no').attr('data-current-page'));
    var totalPages = parseInt($('#page-no').attr('data-total-pages'));
    if (currentPage > 1) {
      var page = currentPage - 1;
      _callbackNextPrev(page);
    }
  },

  'click #next-icon': function () {
    var currentPage = parseInt($('#page-no').attr('data-current-page'));
    var totalPages = parseInt($('#page-no').attr('data-total-pages'));
    if (currentPage < totalPages) {
      var page = currentPage + 1;
      _callbackNextPrev(page);
    }
  },

  'keyup #page-no': function (e) {
    if (e.keyCode == 13) {
      var page = parseInt($('#page-no').val());
      var currentPage = parseInt($('#page-no').attr('data-current-page'));
      var totalPages = parseInt($('#page-no').attr('data-total-pages'));
      if (page >= 1 && page <= totalPages && page!=currentPage) {
        _callbackNextPrev(page);
      }
    }
  }
};
