/*
Data subscription code.
*/
function subscribeToLatestChatroomLog () {
  var _subscriptions = {
    'channels': {},
    'servers': {},
    'pms': {}
  };
  var subs = new SubsManager({
    cacheLimit: 1000,
    expireIn: 9999
  });
  UserChannels.find().observeChanges({
    added: function (id, channel) {
      var loadTime = new Date();
      _subscriptions['channels'][id] = subs.subscribe(
          'latest_channel_log', channel.user_server_name, channel.name);

      localChatRoomLogCount.reset(channel.user_server_name + '::' + channel.name);
      ChannelLogs.find(
        {
          server_name: channel.user_server_name,
          channel_name: channel.name,
          created: {$gt: loadTime},
          global: true
        }
      ).observeChanges({
        added: function (id, fields) {
          localChatRoomLogCount.increment(
            channel.user_server_name + '::' + channel.name);
          var currentRouter = Router.current();
          var userServer = UserServers.findOne({
            name: channel.user_server_name});
          // Alert user on mention on unfocussed chat room
          if (
            userServer &&
            (fields.created > loadTime || !window_focus) &&
            fields.from &&
            messageContainsNick(fields.message, userServer.current_nick) &&
            (
              !(
                currentRouter.params.serverName = userServer.name &&
                '#' + currentRouter.params.channelName == channel.name
              ) || !window_focus
            )
          ) {
              var alert_message = fields.server_name + fields.channel_name
                + ': ' + fields.message;
              $.titleAlert(alert_message, {
                requireBlur:true,
                stopOnFocus:true,
                duration:10000,
                interval:500
              });
            $('#audio-notification')[0].play();
          }
        }
      });
    },
    removed: function (id) {
      if (_subscriptions['channels'][id])
        delete _subscriptions['channels'][id];
    }
  });

  UserPms.find().observeChanges({
    added: function (id, pm) {
      var loadTime = new Date();
      _subscriptions['pms'][id] = subs.subscribe(
          'latest_pm_log', pm.user_server_name, pm.name);
      localChatRoomLogCount.reset(
        pm.user + '||' + pm.user_server_name + '::' + pm.name);
      PMLogs.find(
        {
          server_name: pm.user_server_name,
          from: pm.name,
          created: {$gt: loadTime}
        }
      ).observeChanges({
        added: function (id, fields) {
          var currentRouter = Router.current();
          var userServer = UserServers.findOne({
            name: pm.user_server_name}) || {};
          localChatRoomLogCount.increment(
            pm.user + '||' + pm.user_server_name + '::' + pm.name);
          if (
              (fields.created > loadTime || !window_focus) &&
              (
                !(currentRouter.params.serverName == pm.user_server_name &&
                  currentRouter.params.nick == pm.name) || !window_focus
              )
            ) {
            var alert_message = pm.name + ' messaged you: ' + fields.message;
            $.titleAlert(alert_message, {
              requireBlur:true,
              stopOnFocus:true,
              duration:10000,
              interval:500
            });
            $('#audio-notification')[0].play();
          }
        }
      });
    },
    removed: function (id) {
      if (_subscriptions['channels'][id])
        delete _subscriptions['pms'][id];
    }
  });

  UserServers.find().observeChanges({
    added: function (id, server) {
      var loadTime = new Date();
      var user = Meteor.user();
      if (!user)
        return;
      _subscriptions['servers'][id] = subs.subscribe(
          'latest_server_log', server.name);
      localChatRoomLogCount.reset(user.username + '||' + server.name);
      UserServerLogs.find(
        {
          server_name: server.name,
          created: {$gt: loadTime}
        }
      ).observeChanges({
        added: function (id, fields) {
          localChatRoomLogCount.increment(
            user.username + '||' + server.name);
        }
      });
    },
    removed: function (id) {
      if (_subscriptions['servers'][id])
        delete _subscriptions['servers'][id];
    }
  });
}

Meteor.startup(function () {
  subscribeToLatestChatroomLog();
});
