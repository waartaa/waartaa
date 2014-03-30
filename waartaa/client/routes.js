/* Routers */

Router.configure({
  layoutTemplate: 'body'
});

//Router.before(mustBeSignedIn, {except: ['index']});

Router.map(function () {
  this.route('index', {
    path: '/',
    template: 'user_loggedout_content',
    onBeforeAction: function () {
      if (Meteor.isClient)
        if (Meteor.userId()) {
          Router.go('/chat/');
          this.render('chat');
          GAnalytics.pageview('/chat');
          this.stop();
        }
    },
    onAfterAction: function () {
      if (Meteor.isClient)
        GAnalytics.pageview();
    },
    fastRender: true
  });
  this.route('chat', {
    path: /^\/chat$/,
    onBeforeAction: function () {
      Router.go('/chat/');
    }
  });
  this.route('chat/', {
    path: /^\/chat\/$/,
    template: 'chat',
    onBeforeAction: [
      function () {
        if (Meteor.isClient) {
          if (!Meteor.userId()) {
            Router.go('/');
            this.render('user_loggedout_content');
            GAnalytics.pageview();
            this.stop();
          } else {
            ChatSubscribe();
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
            this.stop(); // stop downstream funcs from running
          }
        }
      }
    ],
    waitOn: function () {
      return [
        Meteor.subscribe('servers'), Meteor.subscribe('user_servers'),
        Meteor.subscribe('user_channels')
      ]
    },
    onAfterAction: function () {
      if (Meteor.isClient)
        GAnalytics.pageview('/chat/');
    },
    fastRender: true
  });
});
