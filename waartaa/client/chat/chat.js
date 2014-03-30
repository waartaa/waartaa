Deps.autorun(updateHeight);


Template.chat_main.chat_logs = function () {
  var room_id = Session.get('room_id');
  if (Session.get('roomtype') == 'channel') {
    return ChannelLogs.find({channel_id: room_id});
  } else if (Session.get('roomtype') == 'pm') {
    var nick = room_id.substr(room_id.indexOf('-') + 1);
    return PMLogs.find({
      $or: [
        {from: nick, to_user_id: Meteor.user()._id},
        {from_user_id: Meteor.user()._id, to: nick}
      ]
    });
  } else if (Session.get('roomtype') == 'server') {
    var server_id = Session.get('room_id');
    return UserServerLogs.find({server_id: server_id});
  }
}

Template.chat_main.topic = function () {
  try {
    var channel = UserChannels.findOne({_id: Session.get('room_id')});
    if (channel) {
      return channel.topic || "";
    }
  } catch (err) {
    return "";
  }
};

Template.chat_main.rendered = updateHeight;


Template.chat_row.rendered = function () {};


$(document).on(
  'scrollend.chat_logs_container', '.chat-logs-container',
  function (e) {
    var $table = $(e.target).find('.chatlogs-table');
    Session.set('chatlogsScrollEnd-' + $table.attr('id'), $table.scrollTop());
  });

UI.registerHelper("isCurrentRoom", function (room_id, room_type, server_id) {
  if (room_id == "ohB9cwuTsTnHMxT7T")
    return true;
  return false;
  /*
  var session_roomtype = Session.get('roomtype');
  var session_room_id = Session.get('room_id');
  var session_server_id = Session.get('server_id');
  if (session_roomtype = room_type && session_room_id == room_id && session_server_id == server_id)
    return true;
  return false;*/
});

/*Template.chat_main.rendered = function () {
  setTimeout(function () {
    updateHeight();
    var roomtype = Session.get('roomtype');
    var key = '';
    var room_id = Session.get('room_id');
    if (roomtype == 'channel')
      key = 'scroll_height_channel-' + room_id;
    else if (roomtype == 'pm')
      key = 'scroll_height_' + room_id;
    else if (roomtype == 'server')
      key = 'scroll_height_server-' + room_id;
    var chat_height = Session.get(key);
    //$('#chat-logs-container').scrollTop(chat_height || $('#chat-logs').height());
  }, 0);
};*/

Template.chat_main.destroyed = function () {
  var roomtype = Session.get('roomtype');
  if (roomtype == 'channel') {
    prefix = roomtype + '-';
    Session.set('scroll_height_' + prefix + Session.get('room_id'), $('#chat-logs-container').scrollTop());
  }
};

Client = {};

Meteor.subscribe("client", Meteor.user() && Meteor.user().username);


Template.channel_menu.rendered = function (e) {
  //Template.channel_menu.events[
  //  'click .editServerChannelLink'] =  _handleServerChannelEditLinkClick;
}




UI.registerHelper("activeChannels", function () {
  return UserChannels.find({active: true});
});

UI.registerHelper("activeServers", function () {
  return UserServers.find();
});

cursors_observed = {};



var focussed = true;

window.onfocus = function () {
  focussed = true;
};

window.onblur = function () {
  focussed = false;
}

UI.registerHelper("serverChatLogs", function (server_id) {
  var cursor = UserServerLogs.find(
    {server_id: server_id}, {sort: {created: 1}});
  var session_key = 'unreadLogsCountServer_' + server_id;
  cursor.observeChanges({
    added: function (id, fields) {
      Deps.nonreactive(function () {
        updateUnreadLogsCount(
          session_key, 'lastAccessedServer-' + fields.server_id,
          fields.last_updated)
      });
    }
  });
  return cursor;
});

//$('.whois-tooltip, .tipsy-enable').tipsy({live: true, gravity: 'e', html: true});
//$('#server-add-btn.enable-tipsy').tipsy({live: true, gravity: 's'});


UI.registerHelper('current_server_away_msg', function () {
  var user_server =  UserServers.findOne({_id: Session.get('server_id')});
  if (user_server)
    return user_server.away_msg || "I'm not around.";
  return '';
});

UI.registerHelper('isConnected', function (status) {
  if (status == 'connected')
    return true;
  else
    return false;
});

UI.registerHelper('session', function (key) {
  return Session.get(key);
});



function logRenders () {
    _.each(Template, function (template, name) {
      var oldRender = template.rendered;
      var counter = 0;
 
      template.rendered = function () {
        oldRender && oldRender.apply(this, arguments);
      };
    });
  }

logRenders();
