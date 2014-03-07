/*
On window resize, call updateHeight() to resize the height of the page
components so that there's no global scroll for the page.
*/
$(window).resize(updateHeight);

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
  passwordSignupFields: 'USERNAME_AND_EMAIL',
  extraSignupFields: []
});
