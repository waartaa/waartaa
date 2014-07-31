/* Routers */

//Router.before(mustBeSignedIn, {except: ['index']});


/* Subscription Managers */

var chatRoomSubs = new SubsManager({
  cacheLimit: 1,
  expireIn: 9999
});

var chatLogSubs = new SubsManager({
  cacheLimit: 5,
  expireIn: 9999
});
/* End Subscription Managers */


/* Configure */
preloadSubscriptions = [];
preloadSubscriptions.push('currentUser');

Router.configure({
  layoutTemplate: 'layout',
  //loadingTemplate: 'loading',
  //notFoundTemplate: 'not_found',
  waitOn: function () {
    return _.map(preloadSubscriptions, function(sub){
      // can either pass strings or objects with subName and subArguments properties
      if (typeof sub === 'object'){
        Meteor.subscribe(sub.subName, sub.subArguments);
      }else{
        Meteor.subscribe(sub);
      }
    });
  }
});
/* End configure */


/* Controllers */

BaseController = RouteController.extend({
  layoutTemplate: 'layout',
  waitOn: function () {

  }
});

BaseChatController = BaseController.extend({
  template: 'chat',
  waitOn: function () {
    return chatRoomSubs.subscribe('chatRooms');
  }
});
/* End controllers */


Router.map(function () {
  this.route('index', {
    path: '/',
    template: 'user_loggedout_content',
    onBeforeAction: function () {
      if (Meteor.isClient)
        if (Meteor.userId()) {
          Router.go('/chat/', {replaceState: true});
          pause();
        }
    },
    onAfterAction: function () {
      if (Meteor.isClient)
        GAnalytics.pageview();
      Session.set('currentPage', 'index');
    },
    fastRender: true
  });

  this.route('account', {
    path: /^\/settings$/,
    onBeforeAction: function() {
      Router.go('/settings/', {replaceState: true});
      pause();
    }
  });

  this.route('account/', {
    path: /^\/settings\/$/,
    template: 'accountSettings',
    layoutTemplate: 'layout',
    onAfterAction: function () {
      Session.set('currentPage', 'account');
    },
    onBeforeAction: [
        function () {
            if (Meteor.isClient) {
                if(!Meteor.userId()) {
                    this.redirect('/');
                }
            }
        },
    ],
  });

  this.route('chat', {
    path: /^\/chat$/,
    onBeforeAction: function () {
      Router.go('/chat/', {replaceState: true});
      pause();
    }
  });
  this.route('chat/', {
    path: /^\/chat\/$/,
    template: 'chat',
    onBeforeAction: [
      function () {
        if (Meteor.isClient) {
          if (!Meteor.userId()) {
            this.redirect('/');
            GAnalytics.pageview();
          } else {
            //ChatSubscribe();
          }
        }
      },
      function () {
        if (Meteor.isClient) {
          // we're done waiting on all subs
          if (this.ready()) {
            NProgress.done();
            if (UserServers.find().count() == 0)
              $('#server-add-btn').click();
          } else {
            NProgress.start();
          }
        }
      }
    ],
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
      Session.set('currentPage', 'chat');
    },
    fastRender: true
  });
  this.route('search', {
    path: /^\/search$/,
    onBeforeAction: function () {
      Router.go('/search/');
    }
  });
  this.route('search/', {
    path: /^\/search\/$/,
    template: 'search',
    onBeforeAction: [
      function (pause) {
        if (Meteor.isClient) {
          if (!Meteor.userId()) {
            Router.go('/');
            this.render('user_loggedout_content');
            GAnalytics.pageview();
            pause();
          } else {
            ChatSubscribe();
          }
        }
      },
      function (pause) {
        if (Meteor.isClient) {
          // we're done waiting on all subs
          if (this.ready()) {
            NProgress.done();
          } else {
            NProgress.start();
            pause(); // stop downstream funcs from running
          }
        }
      }
    ],
    waitOn: function () {
      return [
        Meteor.subscribe('user_servers'),
        Meteor.subscribe('user_channels'),
        Meteor.subscribe('bookmarks')
      ]
    },
    onAfterAction: function () {
      if (Meteor.isClient)
        GAnalytics.pageview('/search/');
    },
    fastRender: true
  });

  /* Router for channel chat room */
  this.route('chatRoomChannel', {
    path: '/chat/server/:serverName/channel/:channelName',
    controller: BaseChatController,
    onBeforeAction: function (pause) {
      var channel = UserChannels.findOne(
        {
          user_server_name: this.params.serverName,
          name: '#' + this.params.channelName
        }
      );
      if (!channel) {
        pause();
        return;
      }
      waartaa.chat.helpers.setCurrentRoom({
        roomtype: 'channel', server_id: channel.user_server_id,
        channel_id: channel._id, channel_name: channel.name,
        server_name: channel.user_server_name
      });
    },
    onRun: function () {
      $('#chatlogs-loader').show();
    },
    onStop: function () {
      $('#chatlogs-loader').fadeOut();
    },
    waitOn: function () {
      var channel = UserChannels.findOne({
        user_server_name: this.params.serverName,
        name: '#' + this.params.channelName
      });
      if (!channel) {
        pause();
        return;
      }
      return [
        chatLogSubs.subscribe(
          'channel_logs', '#' + this.params.channelName,
          Session.get('user_channel_log_count_' + channel._id),
          function () {
            var channel = UserChannels.findOne(
              {
                user_server_name: this.params.serverName,
                name: '#' + this.params.channelName
              }
            ) || {};
            waartaa.chat.helpers.roomAccessedTimestamp.initialize(
              'channel', {
                server_name: channel.user_server_name,
                channel_name: channel.name
              }
            );
          }
        ),
        chatLogSubs.subscribe(
          'channel_nicks', channel.user_server_name, channel.name,
          Session.get('lastNick-' + channel.user_server_name +
                      '_' + channel.name),
          Session.get('startNick-' + channel.user_server_name +
                      '_' + channel.name),
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
              'currentLastNick-' + channel.user_server_name +
              '_' + channel.name,
              (last_nick || {}).nick);
            Session.set(
              'currentStartNick-' + channel.user_server_name +
              '_' + channel.name,
              (start_nick || {}).nick);
            if (Session.get(
              'startNick-' + channel.user_server_name + '_' + channel.name))
              $('#info-panel .nano').nanoScroller();
              $('#info-panel .nano').nanoScroller({scrollTop: 30});
          }
        )
      ];
    }
  });
});
