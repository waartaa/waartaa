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

UI.registerHelper('isCurrentPage', function (page_name){
  return Session.get('currentPage') == page_name;
});

UI.registerHelper('currentServer', function () {
  var currentRoom = Session.get('room') || {};
  return currentRoom.server_name;
});

UI.registerHelper('currentRoom', function () {
  var currentRoom = Session.get('room') || {};
  if (currentRoom.roomtype == 'channel') {
    return currentRoom.channel_name;
  } else if (currentRoom.roomtype == 'pm') {
    return new Spacebars.SafeString(
      '<icon class="fa fa-user fa-inverted"></icon> ' + currentRoom.nick);
  }
});

/* Configure Accounts.ui for authentication */
Accounts.ui.config({
  requestPermissions: {
    github: ['user:email', '(no scope)']
  },
  passwordSignupFields: 'USERNAME_AND_EMAIL',
  extraSignupFields: []
});


/* Manage drawers */
Template.header.events({
  'click .drawer-toggle': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $this = $(e.currentTarget);
    var drawerType = $this.data('target-drawer-type');
    var revDrawerType = drawerType == 'left'? 'right': 'left';
    if ($this.hasClass('active')) {
      $('.drawer-container').removeClass('show-drawer').removeClass(
        'show-drawer-' + drawerType);
      $this.removeClass('active');
    } else {
      $('.drawer-container').addClass('show-drawer').addClass(
        'show-drawer-' + drawerType).removeClass(
        'show-drawer-' + revDrawerType);
      $('.drawer-toggle-' + revDrawerType).removeClass('active');
      $this.addClass('active'); 
    }
  }
});

function hideDrawers () {
  $('.drawer-container').removeClass('show-drawer')
    .removeClass('show-drawer-left')
    .removeClass('show-drawer-right');
  $('.drawer-toggle').removeClass('active');
}

Template.chat.events({
  'click': function (e) {
    var $target = $(e.target);
    if ($target.parents('.drawer-left, .drawer-right').length == 0 &&
        !$target.hasClass('.drawer')) {
      return hideDrawers();
    }
  }
});

Deps.autorun(function () {
  var currentRoom = Session.get('room');
  hideDrawers();
})