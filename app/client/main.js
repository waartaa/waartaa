/*
On window resize, call updateHeight() to resize the height of the page
components so that there's no global scroll for the page.
*/
$(window).resize(updateHeight);

/* Template helpers */
UI.registerHelper("isCurrentPageHome", function () {
  return Session.get('currentPage') === 'home';
});
UI.registerHelper("isUserLoggedIn", function () {
  return Meteor.user();
});
UI.registerHelper("isCurrentPageChat", function () {
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
