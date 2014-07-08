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
  }
};
