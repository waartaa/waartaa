/*
Data subscription code.
*/

ChatSubscribe = function () {
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
          "user_server_logs", user_server.name,
          Session.get('user_server_log_count_' + user_server._id),
          function () {
            $('.chatlogs-loader-msg').fadeOut(1000);
          }
        );
      });
    });
  }

  /*
  Function to subscribe to ChannelLogs for active UserChannels.
  */
  subscribe_channel_logs = function () {
    UserChannels.find({}).forEach(function (channel) {
      Deps.autorun(function () {
        Meteor.subscribe(
          "channel_logs", channel.name,
          Session.get('user_channel_log_count_' + channel._id),
          function () {
            waartaa.chat.helpers.roomAccessedTimestamp.initialize(
              'channel', {
                server_name: channel.user_server_name,
                channel_name: channel.name
              }
            );
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
              waartaa.chat.helpers.roomAccessedTimestamp.initialize(
                'pm', {
                  server_name: user_server.name,
                  nick: nick
                }
              );
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
    UserPms.find().forEach(function (user_pms) {
      var nicks = user_pms.pms || {};
      var nicks_list = [];
      for (nick in nicks)
        nicks_list.push(nick);
      Meteor.subscribe('server_nicks', user_pms.user_server_name, nicks_list);
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
      // Subscribe to ChannelLogs for the subscribed UserChannels
      subscribe_channel_logs();
    });
  };

  subscribe();

  Deps.autorun(subscribe_user_server_logs);
  Deps.autorun(subscribe_channel_logs);
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
                $('#info-panel .nano').nanoScroller();
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
      Meteor.subscribe('server_nicks', function () {
      });
    }
  });
  */

  ChannelLogs.find().observeChanges({
    added: function (id, log) {
      Deps.nonreactive(function () {
        var session_key = 'unreadLogsCountChannel-' + log.channel_id;
        var room = Session.get('room') || {};
        /** Don't update unread logs count for INFO log messages, e.g.,
         * - Nicks joining/leaving channel
         */
        if (!log.from)
          return;
        var options = null;
        var user_server = UserServers.findOne({name: log.server_name});

        if (user_server && messageContainsNick(
            log.message, user_server.current_nick))
          options = {'mention': true};

        waartaa.chat.helpers.unreadLogsCount.increment(
          'channel', {
            server_name: log.server_name,
            channel_name: log.channel_name
          }, log, options
        );
        var new_logs = waartaa.chat.helpers.unreadLogsCount.get(
          'channel', {
            server_name: log.server_name,
            channel_name: log.channel_name
          }
        );
        // Alert user on mention on unfocussed chat room
        if (
          user_server &&
          (new_logs > 0 || !window_focus) &&
          log.from &&
          messageContainsNick(log.message, user_server.current_nick) &&
          (
            (
              (room.roomtype == 'channel' &&
                room.room_id != log.channel_id) ||
              room.roomtype != 'channel'
            ) || !window_focus
          )
        ) {
            var alert_message = log.server_name + log.channel_name + ': ' +
              log.message;
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
        var server = UserServers.findOne({_id: fields.server_id}) || {};
        var nick = server.current_nick == fields.from? fields.to_nick: fields.from;
        if (!nick)
          return;
        var session_key = 'unreadLogsCountPm-' + fields.server_id + '_' + nick;
        var room = Session.get('room') || {};
        var update_session = true;
        if (room.roomtype == 'pm' && room.room_id == fields.server_id + '_' + nick)
          update_session = false;
        new_logs = updateUnreadLogsCount(
          session_key, 'lastAccessedPm-' + fields.server_id + '_' + nick,
          fields.last_updated, update_session);
        if (
            (new_logs > 0 || !window_focus) &&
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
};
