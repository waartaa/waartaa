updateHeight = function () {
  var body_height = $('body').height();
  var final_height = body_height - 90;
  $('#chat, #chat-channel-users, #chat-main, #chat-servers').height(final_height);
}

Template.chat_connections.servers = function () {
  return Servers.find();
}

Template.server_channels.channels = function (server_id) {
  return Channels.find({server_id: server_id});
}

Template.chat_main.channel_logs = function () {
  channel_id = Session.get('channel_id');
  return ChannelLogs.find({channel_id: channel_id});
}

Template.chat_main.rendered = updateHeight;

Template.server_channels.events({
  'click .channel': function (event) {
    var channel_id = $(event.target).data('id');
    $('.channel').parent().removeClass('active');
    $(event.target).parent().addClass('active');
    Session.set('channel_id', channel_id);
  }
});

Template.chat_users.events({
  'click .channel-user': function (event) {
    $('.channel-user').parent().removeClass('active');
    $(event.target).parent().addClass('active');
  }
});

Template.server_channels.rendered = updateHeight;

Template.chat_users.channel_users = function () {
  var channel_id = Session.get('channel_id');
  var channel = Channels.findOne({_id: channel_id});
  var nicks = {};
  if (channel)
    nicks = channel.nicks || {};
  var nicks_list = [];
  for (var key in nicks)
    nicks_list.push({name: key, status: nicks.key})
  return nicks_list;
}

Template.chat_users.rendered = updateHeight;

Client = {};

Meteor.subscribe("client", Meteor.user() && Meteor.user().username);

Template.chat_input.events({
  'submit #chat-input-form': function (event) {
    event.preventDefault();
    var $form = $(event.target);
    var channel_id = Session.get('channel_id');
    var channel = Channels.findOne({_id: channel_id});
    var $chat_input = $form.find('#chat-input');
    var message = $chat_input.val();
    $chat_input.val('');
    ChannelLogs.insert({
      from: 'rtnpro',
      user_id: Meteor.user()._id,
      channel: channel.name,
      channel_id: channel_id,
      message: message
    })
    Meteor.call('say', message, channel_id);
  }
});