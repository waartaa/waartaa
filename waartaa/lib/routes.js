/* Routers */

Router.configure({
  autoRender: false,
});

//Router.before(mustBeSignedIn, {except: ['index']});

Router.map(function () {
  this.route('index', {
    path: '/',
    template: 'user_loggedout_content',
    before: function () {
      if (Meteor.userId()) {
        Router.go('/chat/');
        this.render('chat');
        GAnalytics.pageview('/chat');
        this.stop();
      }
    },
    after: function () {
      GAnalytics.pageview();
    },
    fastRender: true
  });
  this.route('chat', {
    path: /^\/chat$/,
    before: function () {
      Router.go('/chat/');
    }
  });
  this.route('chat/', {
    path: /^\/chat\/$/,
    template: 'chat',
    before: [
      function () {
        if (!Meteor.userId()) {
          Router.go('/');
          this.render('user_loggedout_content');
          GAnalytics.pageview();
          this.stop();
        } else {
          ChatSubscribe();
        }
      },
      function () {
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
    ],
    waitOn: function () {
      return [
        Meteor.subscribe('servers'), Meteor.subscribe('user_servers'),
        Meteor.subscribe('user_channels')
      ]
    },
    after: function () {
      GAnalytics.pageview('/chat/');
    },
    fastRender: true
  });
});
