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
  'click .advance-field-link': function () {
    var active = $('.advance-field-link').data('active');
    if (active) {
      $('.advance-field').hide();
      $('.advance-field-link').text('Show advance search');
      $('.advance-field-link').data('active', false);
    } else {
      $('.advance-field').show();
      $('.advance-field-link').text('Hide advance search');
      $('.advance-field-link').data('active', true);
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
