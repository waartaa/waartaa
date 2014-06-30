/* Routers */

Router.configure({
  layoutTemplate: 'layout'
});

//Router.before(mustBeSignedIn, {except: ['index']});

Router.map(function () {
  this.route('index', {
    path: '/',
    template: 'user_loggedout_content',
    onBeforeAction: function () {
      if (Meteor.isClient)
        if (Meteor.userId()) {
          this.redirect('/chat/');
        }
    },
    onAfterAction: function () {
      if (Meteor.isClient)
        GAnalytics.pageview();
    },
    fastRender: true
  });

  this.route('account', {
    path: /^\/settings$/,
    onBeforeAction: function() {
      this.redirect('/settings/');
    }
  });

  this.route('account/', {
    path: /^\/settings\/$/,
    template: 'accountSettings',
    layoutTemplate: 'layout',
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
      this.redirect('/chat/');
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
