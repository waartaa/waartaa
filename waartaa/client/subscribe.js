/*
Data subscription code.
*/

/*
Default initial chat log count to load for each room.
A room may be a channel, server or PM room.
*/
DEFAULT_LOGS_COUNT = 30;

/*
Function to subscribe to UserServerLogs for active UserServers.
*/
subscribe_user_server_logs = function () {
  UserServers.find().forEach(function (user_server) {
    Deps.autorun(function () {
      Meteor.subscribe(
        "user_server_logs", user_server._id,
        Session.get('user_server_log_count_' + user_server._id),
        function () {
          $('.chatlogs-loader-msg').fadeOut(1000);
        }
      );
    });
  });
}

/*
Function to subscribe to UserChannelLogs for active UserChannels.
*/
subscribe_user_channel_logs = function () {
  UserChannels.find({}).forEach(function (channel) {
    Deps.autorun(function () {
      Meteor.subscribe(
        "user_channel_logs", channel._id,
        Session.get('user_channel_log_count_' + channel._id),
        function () {
          $('.chatlogs-loader-msg').fadeOut(1000);
        }
      );
    });
  });
}

/*
Function to subscribe to PMLogs for active PMs.
*/
subscribe_pm_logs = function () {
  var user = Meteor.user();
  UserServers.find().forEach(function (user_server) {
    // Server nicks with whom PM chat is active for the user.
    var nicks = (UserPms.findOne({user_server_id: user_server._id}) || {}).pms || [];
    for (nick in nicks) {
      // PM room_id is a combination of user_server ID and PM nick.
      var room_id = user_server._id + '_' + nick;
      // Subscribe to PMLogs with a server nick.
      Deps.autorun(function () {
        Meteor.subscribe(
          'pm_logs', room_id,
          Session.get('pmLogCount-' + room_id),
          function () {
            $('.chatlogs-loader-msg').fadeOut(1000);
          }
        );
      });
    }
  });
}

/* 
Function to subscribe to ServerNicks for active PMs
*/
subscribe_server_nicks_for_pms = function () {
  var user = Meteor.user();
  if (!user)
    return;
  UserServers.find().forEach(function (user_server) {
    var nicks = (user.profile.connections[user_server._id] || {}).pms || {};
    var nicks_list = [];
    for (nick in nicks)
      nicks_list.push(nick);
    Meteor.subscribe('server_nicks', user_server.name, nicks_list);
  });
};

/*
Function to subscribe to collection data published by server.
*/
subscribe = function () {
  // Subscribe to server connection presets to choose from during adding
  // a new server
  Meteor.subscribe("servers");

  // Subscribe to UserServers collection for the current user.
  Meteor.subscribe("user_servers", function () {
    // Callback once subscribed to UserServers
    UserServers.find().forEach(function (user_server) {
      // We set the initial log count for each server room.
      Session.set(
        "user_server_log_count_" + user_server._id, DEFAULT_LOGS_COUNT);
      // We also set initial log count for the PM rooms in which the
      // user was chatting.
      var user = Meteor.user();
      // FIXME: We need to find a better place to save active PMs
      // rather than in user.profile.
      var pm_nicks = (
        user.profile.connections[user_server._id] || {}).pms || [];
      for (nick in pm_nicks) {
        var room_id = user_server._id + '_' + nick;
        Session.set('pmLogCount-' + room_id, DEFAULT_LOGS_COUNT);
      }
    });
    // Subscribe to UserServerLogs collection
    subscribe_user_server_logs();
    // Subscribe to PMLogs collection
    subscribe_pm_logs();
    // Subscribe to ServerNicks collection for active PM nicks
    subscribe_server_nicks_for_pms();
  });

  // Subscribe to UserChannels collection.
  Meteor.subscribe("user_channels", function () {
    // Callback when subscribed to UserChannels
    UserChannels.find({}).forEach(function (channel) {
      // Set initial log count for each channel room
      Session.set("user_channel_log_count_" + channel._id, DEFAULT_LOGS_COUNT);
    });
    // Subscribe to UserChannelLogs for the subscribed UserChannels
    subscribe_user_channel_logs();
  });
};

subscribe();

Deps.autorun(subscribe_user_server_logs);
Deps.autorun(subscribe_user_channel_logs);
Deps.autorun(subscribe_pm_logs);
Deps.autorun(subscribe_server_nicks_for_pms);

/*
Function to subscribe to ChannelNicks collection.
ChannelNicks is a global collection (for all users) which contains
nick names present in each channel.
*/
subscribe_user_channel_nicks = function (channel) {
  if (!channel)
    return;
  /* 
  Subscribe to certain range of ChannelNicks for a UserChannel.

  The 4th argument of this call represents the from_nick: the nick from which
  to fetch next N channel nicks (alphabetically).

  The 5th argument of this call represents the to_nick: the nick before which
  we have to fetch N previous channel nicks (alphabetically).

  Only one of from_nick and to_nick is not null at a time. This is used to
  handle upwards and downards pagination of channel nicks for a channel.

  We paginate in showing channel nicks for a channel to make the client side
  faster and more memory efficient. This gracefully handles channels like
  #freenode with more that 1500 active channel nicks.
  */
  Meteor.subscribe(
    'channel_nicks', channel.user_server_name, channel.name,
    Session.get('lastNick-' + channel.user_server_name + '_' + channel.name),
    Session.get('startNick-' + channel.user_server_name + '_' + channel.name),
    function () {
        Meteor.setTimeout(
          function () {
            $('.channel-nicks-loader').fadeOut(1000);
            var last_nick = ChannelNicks.findOne(
                {
                  channel_name: channel.name,
                  server_name: channel.user_server_name,
                },
                {
                  sort: {nick: -1}
                }
              );
            var start_nick = ChannelNicks.findOne(
                {
                  channel_name: channel.name,
                  server_name: channel.user_server_name,
                },
                {
                  sort: {nick: 1}
                }
              );
            Session.set(
              'currentLastNick-' + channel.user_server_name + '_' + channel.name,
              (last_nick || {}).nick);
            Session.set(
              'currentStartNick-' + channel.user_server_name + '_' + channel.name,
              (start_nick || {}).nick);
            if (Session.get(
              'startNick-' + channel.user_server_name + '_' + channel.name))
              $('#info-panel .nano').nanoScroller({scrollTop: 30});
          }, 500);
      }
    );
}

/* 
Automatically subscribe to ChannelNicks for newly joined UserChannels.
*/
UserChannels.find().observeChanges({
  added: function (id, channel) {
    console.log('Added new channel');
    console.log(channel);
    Deps.autorun(
      function () {
        subscribe_user_channel_nicks(channel);
      });
  }
});

Meteor.subscribe('user_pms');
/*
UserServers.find().observeChanges({
  added: function (id, user_server) {
    console.log('Added new server');
    console.log(user_server);
    Meteor.subscribe('server_nicks', function () {
      console.log('subscribed to server nicks');
      console.log(ServerNicks.find().count());
    });
  }
});
*/

UserChannelLogs.find().observeChanges({
  added: function (id, log) {
    Deps.nonreactive(function () {
      var session_key = 'unreadLogsCountChannel-' + log.channel_id;
      var new_logs = updateUnreadLogsCount(
        session_key, 'lastAccessedChannel-' + log.channel_id,
        log.last_updated);
      var user_server = UserServers.findOne({_id: log.server_id});
      if (!user_server)
        return;
      var room = Session.get('room') || {};
      if (
        new_logs > 0 &&
        log.message.search(user_server.current_nick) >= 0 &&
        (
          (
            (room.roomtype == 'channel' &&
              room.room_id != log.channel_id) ||
            room.roomtype != 'channel'
          ) || !window_focus
        )
      ) {
          var alert_message = log.server_name + log.channel_name + ': ' + log.message;
          $.titleAlert(alert_message, {
            requireBlur:true,
            stopOnFocus:true,
            duration:10000,
            interval:500
          });
        $('#audio-notification')[0].play();
      }
    });
  }
});

PMLogs.find().observeChanges({
  added: function (id, fields) {
    Deps.nonreactive(function () {
      var session_key = 'unreadLogsCountPm-' + fields.server_id + '_' + nick;
      new_logs = updateUnreadLogsCount(
        session_key, 'lastAccessedPm-' + fields.server_id + '_' + nick,
        fields.last_updated);
      var room = Session.get('room') || {};
      if (
          new_logs > 0 &&
          (
            (room.room_id != fields.server_id + '_' + nick) || !window_focus
          )
        ) {
        var alert_message = nick + ' messaged you: ' + fields.message;
        $.titleAlert(alert_message, {
          requireBlur:true,
          stopOnFocus:true,
          duration:10000,
          interval:500
        });
        $('#audio-notification')[0].play();
      }
    });
  }
});
