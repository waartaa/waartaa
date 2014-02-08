/*
On window resize, call updateHeight() to resize the height of the page
components so that there's no global scroll for the page.
*/
$(window).resize(updateHeight);

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
    }
  });
  this.route('chat', {
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
    }
  });
});

/* Template helpers */
Handlebars.registerHelper("isCurrentPageHome", function () {
  return Session.get('currentPage') === 'home';
});
Handlebars.registerHelper("isUserLoggedIn", function () {
  return Meteor.user();
});
Handlebars.registerHelper("isCurrentPageChat", function () {
  return Session.get('currentPage') === 'chat';
});

/* Configure Accounts.ui for authentication */
Accounts.ui.config({
  requestPermissions: {
    github: ['user:email', '(no scope)']
  },
  passwordSignupFields: 'USERNAME_AND_EMAIL'
});
