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

var _callbackNextPrev = function (page) {
  var bookmarkId = Session.get('bookmarkId');
  if (bookmarkId) {
    var bookmark = Bookmarks.findOne({_id: bookmarkId});
    var channel_name = bookmark.roomInfo.channel_name;
    var server_name = bookmark.roomInfo.server_name;
    var logTimestamp = bookmark.logTimestamp;
    waartaa.bookmarks.helpers.getBookmarkedItems(logTimestamp, channel_name, server_name, page);
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
    waartaa.search.helpers.callAPI(serverName, channelName, getParams);
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
