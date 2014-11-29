/* Routers */

//Router.before(mustBeSignedIn, {except: ['index']});

/* Reset SubsManager */
SubsManager.prototype.reset = function() {
  var self = this;
  _.each(self._cacheList, function(sub) {
    delete self._cacheMap[sub.hash];
  });
  self._cacheList = [];
};

/* Subscription Managers */

var chatRoomSubs = new SubsManager({
  cacheLimit: 1,
  expireIn: 9999
});

var chatLogSubs = new SubsManager({
  cacheLimit: 5,
  expireIn: 9999
});

var chatLogPaginationSubs = new SubsManager({
  cacheLimit: 3,
  expireIn: 9999
});

var serverNickSubs = new SubsManager({
  cacheLimit: 5,
  expireIn: 9999
});

var channelNicksSubs = new SubsManager({
  cacheLimit: 1,
  expireIn: 9999
});
/* End Subscription Managers */


/* Configure */
preloadSubscriptions = [];
preloadSubscriptions.push('currentUser');

Router.configure({
  layoutTemplate: 'layout',
  //loadingTemplate: 'loading',
  notFoundTemplate: 'notFound',
  waitOn: function () {
    return _.map(preloadSubscriptions, function(sub){
      // can either pass strings or objects with subName and subArguments properties
      if (typeof sub === 'object'){
        Meteor.subscribe(sub.subName, sub.subArguments);
      }else{
        Meteor.subscribe(sub);
      }
    });
  },
  trackPageView: true
});

/* End configure */


/* Controllers */

BaseController = RouteController.extend({
  layoutTemplate: 'layout',
  notFoundTemplate: 'notFound',
  onAfterAction: function () {
    navManager.set();
  }
});

BaseChatController = BaseController.extend({
  template: 'chat',
  loadingTemplate: 'chat',
  waitOn: function () {
    return chatRoomSubs.subscribe('chatRooms');
  },
  onRerun: function () {
    if (!this.ready()) {
      NProgress.start();
    }
    if (navManager.isSamePage(Router.current())) {
      var pageStack = waartaa.chat.helpers.chatLogsWaypointHandler.getPageStack();
      if (pageStack.length > 0 && this.params.query.from &&
          moment(this.params.query.from).toDate().toString() ==
          pageStack[0].toString())
        waartaa.chat.helpers.chatLogsWaypointHandler.bind();
      if (this.params.query.direction == 'down')
        $('.chatlogs-scroll-down .chatlogs-loader-msg').show();
      else if (this.params.query.direction == 'up' && pageStack.length > 1)
        $('.chatlogs-scroll-up .chatlogs-loader-msg').show();
    } else {
      $('#chatlogs-loader').show();
      chatLogPaginationSubs.reset();
    }
    this.next();
  },
  onBeforeAction: function () {
    if (Meteor.isClient) {
        if(!Meteor.userId()) {
          this.redirect('/');
        }
        this.next();
    } else {
      this.next();
    }
  },
  onAfterAction: function () {
    if (this.ready()) {
      Meteor.setTimeout(function () {
        waartaa.chat.helpers.chatLogsWaypointHandler.bind();
      }, 1000);
    }
    Session.set('currentPage', 'chat');
    if (Router.current().url != '/chat' && Meteor.user())
      window.localStorage.setItem(
        Meteor.user().username + ':lastChatPath', Router.current().url);
    if (this.ready())
      NProgress.done();
    var params = this.params;
    if (this.ready())
      Tracker.nonreactive(function () {
        waartaa.chat.helpers.resetUnreadLogsCountForChatroom(params);
      });
  },
  data: function () {
    Meteor.setTimeout(function () {
      $('.chatlogs-loader-msg').fadeOut();
    }, 2000);
    $('#chatlogs-loader').fadeOut();
  },
  onStop: function () {
    waartaa.chat.helpers.chatLogsWaypointHandler.unbind();
    var params = this.params;
    Tracker.nonreactive(function () {
      waartaa.chat.helpers.resetUnreadLogsCountForChatroom(params);
    });
  }
});
/* End controllers */



Router.route('/', {
  name: 'index',
  controller: 'BaseController',
  template: 'user_loggedout_content',
  onBeforeAction: function () {
    if (Meteor.isClient)
      if (Meteor.userId()) {
        Router.go('/chat', {replaceState: true});
        return;
      }
    this.next();
  },
  onAfterAction: function () {
    Session.set('currentPage', 'index');
  },
  fastRender: true
});

Router.route('/foo', function () {
  this.render('foo');
});

Router.route('/settings', {
  name: 'account',
  template: 'accountSettings',
  layoutTemplate: 'layout'
});

  Router.route('/chat', {
    template: 'chat',
    onBeforeAction: //[
      function () {
        if (Meteor.isClient) {
          if (!Meteor.userId()) {
            this.redirect('/');
            GAnalytics.pageview();
          } else {
            if (!this.ready() && !UserChannels.findOne())
              return;
            var path = Meteor.user() && window && window.localStorage &&
              window.localStorage.getItem(
                Meteor.user().username + ':lastChatPath');
            if (!path) {
              var userServer = UserServers.findOne();
              if (userServer)
                path = Router.routes['chatRoomServer'].path({
                  serverName: userServer.name
                });
            }
            if (path) {
              Router.go(path, replaceState=true);
              return;
            }
          }
        }
        this.next();
      }/*,
      function () {
        if (Meteor.isClient && this.ready()) {
          if (UserServers.find().count() == 0)
            $('#server-add-btn').click();
            return;
        }
        this.next();
      }*/
    ,//],
    waitOn: function () {
      return [
        Meteor.subscribe('servers'),
        Meteor.subscribe('user_servers'),
        Meteor.subscribe('user_channels'),
        Meteor.subscribe('bookmarks')
      ]
    },
    controller: 'BaseChatController',
    onAfterAction: function () {
      if (Meteor.isClient)
        GAnalytics.pageview('/chat/');
    },
    fastRender: true
  });

  /* Router for server chat room */
  Router.route('/chat/server/:serverName', {
    name: 'chatRoomServer',
    controller: BaseChatController,
    onBeforeAction: function () {
      var server = UserServers.findOne({name: this.params.serverName});
      if (!server) {
        if (this.ready())
          waartaa.chat.helpers.setCurrentRoom();
        else {
          return;
        }
      }
      waartaa.chat.helpers.setCurrentRoom({
        roomtype: 'server', server_id: server._id, server_name: server.name
      });
      if (this.ready()) {
        var redirect = waartaa.chat.helpers.chatLogsWaypointHandler
                      .handleScrolldownResponse(this.params);
        if (redirect)
          return;
      }
      this.next();
    },
    waitOn: function () {
      var userServer = UserServers.findOne(
        {name: this.params.serverName});
      if (!userServer)
        return;
      var subsManager = this.params.direction?
        chatLogPaginationSubs: chatLogSubs;
      var from = this.params.query.from || null;
      var direction = this.params.query.direction || 'down';
      var limit = this.params.query.limit || DEFAULT_LOGS_COUNT;
      return [
        subsManager.subscribe(
          "user_server_logs", userServer.name,
          from, direction, limit,
          function () {
            $('.chatlogs-loader-msg').fadeOut(1000);
          }
        )
      ];
    }
  });

  function channelNicksSubscriptionCallback (serverName, channelName) {
    $('.channel-nicks-loader').fadeOut(1000);
    var last_nick = ChannelNicks.findOne(
      {
        channel_name: channelName,
        server_name: serverName,
      },
      {
        sort: {nick: -1}
      }
    );
    var start_nick = ChannelNicks.findOne(
      {
        channel_name: channelName,
        server_name: serverName,
      },
      {
        sort: {nick: 1}
      }
    );
    Session.set(
      'currentLastNick-' + serverName +
      '_' + channelName,
      (last_nick || {}).nick);
    Session.set(
      'currentStartNick-' + serverName +
      '_' + channelName,
      (start_nick || {}).nick);
    if (Session.get(
      'startNick-' + serverName + '_' + channelName))
      $('#info-panel .nano').nanoScroller();
      $('#info-panel .nano').nanoScroller({scrollTop: 30});
  }

  /* Router for channel chat room */
  Router.route('chatRoomChannel', {
    path: '/chat/server/:serverName/channel/:channelName',
    controller: BaseChatController,
    onBeforeAction: function () {
      var channel = UserChannels.findOne(
        {
          user_server_name: this.params.serverName,
          name: '#' + this.params.channelName
        }
      );
      if (!channel) {
        if (this.ready())
          waartaa.chat.helpers.setCurrentRoom();
        else
          return;
      }
      waartaa.chat.helpers.setCurrentRoom({
        roomtype: 'channel', server_id: channel.user_server_id,
        channel_id: channel._id, channel_name: channel.name,
        server_name: channel.user_server_name
      });
      if (this.ready()) {
        var redirect = waartaa.chat.helpers.chatLogsWaypointHandler
                      .handleScrolldownResponse(this.params);
        if (redirect)
          return;
      }
      this.next();
    },
    onAfterAction: function () {
      var channelName = '#' + this.params.channelName;
      var serverName = this.params.serverName;
      Tracker.autorun(function () {
        channelNicksSubs.subscribe(
          'channel_nicks', serverName, channelName,
          Session.get('lastNick-' + serverName + '_' + channelName),
          Session.get('startNick-' + serverName + '_' + channelName),
          function () {
            Meteor.setTimeout(function () {
              channelNicksSubscriptionCallback(serverName, channelName);
            }, 300);
          }
        );
      });
    },
    waitOn: function () {
      var channel = UserChannels.findOne({
        user_server_name: this.params.serverName,
        name: '#' + this.params.channelName
      }) || {};
      var channelName = '#' + this.params.channelName;
      var serverName = this.params.serverName;
      var subsManager = this.params.query.direction?
        chatLogPaginationSubs: chatLogSubs;
      var from = this.params.query.from || null;
      var direction = this.params.query.direction || 'down';
      var limit = this.params.query.limit || DEFAULT_LOGS_COUNT;
      return [
        subsManager.subscribe(
          'channel_logs', serverName, channelName,
          from, direction, limit,
          function () {
            var channel = UserChannels.findOne(
              {
                user_server_name: serverName,
                name: channelName
              }
            ) || {};
            waartaa.chat.helpers.roomAccessedTimestamp.initialize(
              'channel', {
                server_name: serverName,
                channel_name: channelName
              }
            );
          }
        )
      ];
    }
  });

  /* Router for PM chat room */
  Router.route('chatRoomPM', {
    path: '/chat/server/:serverName/nick/:nick',
    controller: BaseChatController,
    onBeforeAction: function () {
      var user = Meteor.user();
      var server = UserServers.findOne({name: this.params.serverName});
      if (!server) {
        if (this.ready())
          waartaa.chat.helpers.setCurrentRoom();
        else
          return;
      }
      var nick = this.params.nick;
      var userPm = UserPms.findOne({
        user_server_name: server.name, name: nick});
      if (!userPm) {
        UserPms.insert({
          user_server_id: server._id, user_server_name: server.name,
          user: user.username, user_id: user._id,
          name: nick
        });
      }
      Meteor.setTimeout(function () {
        var userPm = UserPms.findOne({
          user_server_name: server.name, name: nick});
        waartaa.chat.helpers.setCurrentRoom({
          roomtype: 'pm', server_id: server._id,
          room_id: userPm._id,
          server_name: server.name, nick: nick
        });
      }, 100);
      Meteor.call('send_command', server.name, '/WHOIS ' + nick, {});
      if (this.ready()) {
        var redirect = waartaa.chat.helpers.chatLogsWaypointHandler
                      .handleScrolldownResponse(this.params);
        if (redirect)
          return;
      }
      this.next();
    },
    waitOn: function () {
      var userServer = UserServers.findOne(
        {name: this.params.serverName});
      if (!userServer)
        return;
      var nick = this.params.nick;
      var room_id = userServer._id + '_' + nick;
      var subsManager = this.params.query.direction?
        chatLogPaginationSubs: chatLogSubs;
      var from = this.params.query.from || null;
      var direction = this.params.query.direction || 'down';
      var limit = this.params.query.limit || DEFAULT_LOGS_COUNT;
      return [
        subsManager.subscribe(
          'pm_logs', room_id, from, direction, limit,
          function () {
            waartaa.chat.helpers.roomAccessedTimestamp.initialize(
              'pm', {
                server_name: userServer.name,
                nick: nick
              }
            );
          }
        ),
        serverNickSubs.subscribe(
          'server_nicks', userServer.name, [nick]
        )
      ];
    }
  });
