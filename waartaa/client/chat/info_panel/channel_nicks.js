UI.registerHelper('channel_users', function (id) {
  var channel_id = id;
  var channel = UserChannels.findOne({_id: channel_id});
  if (!channel)
    return;
  var query = {
    channel_name: channel.name, server_name: channel.user_server_name};
  var last_nick = Session.get(
    'lastNick-' + channel.user_server_name + '_' + channel.name);
  if (last_nick)
    query['nick'] = {$gt: last_nick};
  return ChannelNicks.find(
    query,
    {fields: {nick: 1}, sort: {nick: 1}});
});

Template.chat_users.rendered = updateHeight;

function infoPanelScrollendHandler (e) {
  var $target = $(e.target);
  Meteor.setTimeout(function () {
    $(document).off('scrollend.info_panel')
    .on('scrollend.info_panel', '#info-panel .nano',
        infoPanelScrollendHandler);
  }, 2000);
  var room = Session.get('room') || {};
  if (room.roomtype == 'channel') {
    var channel = UserChannels.findOne({_id: room.room_id});
    if (!channel)
      return;
    var count = ChannelNicks.find(
        {channel_name: channel.name, server_name: channel.user_server_name}
      ).count();
    var startNick = Session.get(
        'startNick-' + channel.user_server_name + '_' + channel.name);
    if (count < 40 && (count < 30 || !startNick))
      return;
    $(document).off('scrollend.info_panel');
    $('.channel-nicks-loader.scrollend').show();
    Meteor.setTimeout(function () {
      $('.channel-nicks-loader.scrollend').fadeOut(1000);
    }, 5000);
    var nth_channel_nick = ChannelNicks.findOne(
      {channel_name: channel.name, server_name: channel.user_server_name},
      {skip: 10, sort: {nick: 1}});
    var current_last_nick = Session.get(
      'currentLastNick-' + channel.user_server_name + '_' + channel.name);
    Session.set(
      'lastNick-' + channel.user_server_name + '_' + channel.name,
      nth_channel_nick.nick);
    Session.set(
      'startNick-' + channel.user_server_name + '_' + channel.name,
      null);
  }
}

$(document).on('scrollend.info_panel', '#info-panel .nano',
               infoPanelScrollendHandler);

function infoPanelScrolltopHandler (e) {
  var $target = $(e.target);
  Meteor.setTimeout(function () {
    $(document).off('scrolltop.info_panel')
    .on('scrolltop.info_panel', '#info-panel .nano',
        infoPanelScrolltopHandler);
  }, 2000);
  var room = Session.get('room') || {};
  if (room.roomtype == 'channel') {
    var channel = UserChannels.findOne({_id: room.room_id});
    if (!channel)
      return;
    if (ChannelNicks.find(
        {channel_name: channel.name, server_name: channel.user_server_name}
      ).count() < 40)
      return;
    $(document).off('scrolltop.info_panel');
    $('.channel-nicks-loader.scrolltop').show();
    Meteor.setTimeout(function () {
      $('.channel-nicks-loader.scrolltop').fadeOut(1000);
    }, 5000);
    var nth_channel_nick = ChannelNicks.findOne(
      {channel_name: channel.name, server_name: channel.user_server_name},
      {skip: 10, sort: {nick: -1}});
    var current_last_nick = Session.get(
      'currentLastNick-' + channel.user_server_name + '_' + channel.name);
    var current_start_nick = Session.get(
      'currentStartNick-' + channel.user_server_name + '_' + channel.name);
    Session.set(
      'startNick-' + channel.user_server_name + '_' + channel.name,
      nth_channel_nick.nick);
    Session.set(
      'lastNick-' + channel.user_server_name + '_' + channel.name,
      null);
  }
}

$(document).on('scrolltop.info_panel', '#info-panel .nano',
  infoPanelScrolltopHandler);

Template.channel_nicks_info.helpers({
  currentChannel: function () {
    var room = Session.get('room') || {};
    if (room.roomtype != 'channel')
      return;
    return UserChannels.findOne({_id: room.room_id});
  }
});
