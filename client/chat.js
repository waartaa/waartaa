updateHeight = function () {
  highlightChannel();
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

Template.chat.rendered = function () {
  $('.content-main').addClass('no-padding');
}

function  highlightChannel () {
  var channel_id = Session.get('channel_id');
  $('.channel').parent().removeClass('active');
  $('.channel#channel-id-' + channel_id).parent().addClass('active');
}

Template.chat_main.channel_logs = function () {
  channel_id = Session.get('channel_id');
  return ChannelLogs.find({channel_id: channel_id});
}

Template.chat_main.rendered = updateHeight;

Template.chat_main.events = {
  'scroll #chat-main': function (event) {
    var scroll_top = $(event.target).scrollTop();
    if ((event.target.scrollHeight - scroll_top) <= $(this).outerHeight())
      scroll_top = null;
    Session.set('scroll_height_' + Session.get('channel_id'),
      scroll_top);
  }
};

Template.server_channels.events({
  'click .channel': function (event) {
    if ($(event.target).hasClass('caret'))
      return;
    event.stopPropagation();
    var cur_channel_id = Session.get('channel_id');
    $('.dropdown.open').removeClass('open');
    Session.set('scroll_height_' + cur_channel_id, $('#chat-main').scrollTop() || null);
    Session.set('channel_id', $(event.target).data('id'));
    highlightChannel();
  }
});

Template.chat_users.events({
  'click .channel-user': function (event) {
    if ($(event.target).hasClass('caret'))
      return;
    event.stopPropagation();
    $('.channel-user').parent().removeClass('active');
    $('.dropdown.open').removeClass('open');
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

Template.chat_main.rendered = function () {
  setTimeout(function () {
    var channel_height = Session.get(
      'scroll_height_' + Session.get('channel_id'));
    $('#chat-main').scrollTop(channel_height || $('#chat-logs').height());
  }, 0);
};

Template.chat_main.destroyed = function () {
  Session.set('scroll_height_' + Session.get('channel_id'), $('#chat-main').scrollTop());
};

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
    if (!message)
      return;
    $chat_input.val('');
    ChannelLogs.insert({
      from: 'rtnpro',
      user_id: Meteor.user()._id,
      channel: channel.name,
      channel_id: channel_id,
      message: message
    });
    Meteor.call('say', message, channel_id);
    Session.set('scroll_height_' + channel_id, null);
  }
});
