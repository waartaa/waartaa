/*
On window resize, call updateHeight() to resize the height of the page
components so that there's no global scroll for the page.
*/
$(window).resize(updateHeight);

/* Routers */
Meteor.Router.add({
  '': function () {
    GAnalytics.pageview();
    if (Meteor.userId()) {
      location.href = "/chat";
    } else
      return 'user_loggedout_content';
  },
  '/chat': function () {
    if (Meteor.userId()) {
      GAnalytics.pageview('/chat');
      Session.set('currentPage', 'chat');
      return 'chat';
    } else
      location.href = '/';
  }
});

Meteor.Router.filters({
  'login_required': function (page) {
    if (Meteor.user()) {
      return page;
    } else {
      return 'user_loggedout_content';
    }
  }
});

/* Only logged in users can access the chat page */
Meteor.Router.filter('login_required', {only: ['user_dashboard', 'chat']});

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
    github: ['user', 'repo']
  },
  passwordSignupFields: 'USERNAME_AND_EMAIL'
});
