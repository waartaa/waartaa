/*
Default initial chat log count to load for each room.
A room may be a channel, server or PM room.
*/
DEFAULT_LOGS_COUNT = 40;


/*
Function to subscribe to collection data published by server.
*/
subscribe = function () {
  // Subscribe to server connection presets to choose from during adding
  // a new server
  Meteor.subscribe("servers");

  // Subscribe to UserServers collection for the current user.
  Meteor.subscribe("user_servers", function () {
    // Callback once subscribed to UserServers
    UserServers.find().forEach(function (user_server) {
      // We set the initial log count for each server room.
      Session.set(
        "user_server_log_count_" + user_server._id, DEFAULT_LOGS_COUNT);
      // We also set initial log count for the PM rooms in which the
      // user was chatting.
      var user = Meteor.user();
      // FIXME: We need to find a better place to save active PMs
      // rather than in user.profile.
      var pm_nicks = (
        user.profile.connections[user_server._id] || {}).pms || [];
      for (nick in pm_nicks) {
        var room_id = user_server._id + '_' + nick;
        Session.set('pmLogCount-' + room_id, DEFAULT_LOGS_COUNT);
      }
    });
    // Subscribe to UserServerLogs collection
    subscribe_user_server_logs();
    // Subscribe to PMLogs collection
    subscribe_pm_logs();
    // Subscribe to ServerNicks collection for active PM nicks
    subscribe_server_nicks_for_pms();
  });

  // Subscribe to UserChannels collection.
  Meteor.subscribe("user_channels", function () {
    // Callback when subscribed to UserChannels
    UserChannels.find({}).forEach(function (channel) {
      // Set initial log count for each channel room
      Session.set("user_channel_log_count_" + channel._id, DEFAULT_LOGS_COUNT);
    });
    // Subscribe to UserChannelLogs for the subscribed UserChannels
    subscribe_user_channel_logs();
  });
};

subscribe();

/*
Function to subscribe to PMLogs for active PMs.
*/
subscribe_pm_logs = function () {
  var user = Meteor.user();
  UserServers.find().forEach(function (user_server) {
    // Server nicks with whom PM chat is active for the user.
    var nicks = (user.profile.connections[user_server._id] || {}).pms || [];
    for (nick in nicks) {
      // PM room_id is a combination of user_server ID and PM nick.
      var room_id = user_server._id + '_' + nick;
      // Subscribe to PMLogs with a server nick.
      Meteor.subscribe(
        'pm_logs', room_id,
        Session.get('pmLogCount-' + room_id)
      );
    }
  });
}

Deps.autorun(subscribe_pm_logs);

/* 
Function to subscribe to ServerNicks for active PMs
*/
subscribe_server_nicks_for_pms = function () {
  var user = Meteor.user();
  if (!user)
    return;
  UserServers.find().forEach(function (user_server) {
    var nicks = (user.profile.connections[user_server._id] || {}).pms || {};
    var nicks_list = [];
    for (nick in nicks)
      nicks_list.push(nick);
    Meteor.subscribe('server_nicks', user_server.name, nicks_list);
  });
};

Deps.autorun(subscribe_server_nicks_for_pms);

/*
Function to subscribe to UserChannelLogs for active UserChannels.
*/
subscribe_user_channel_logs = function () {
  UserChannels.find({}).forEach(function (channel) {
    Meteor.subscribe(
      "user_channel_logs", channel._id,
      Session.get('user_channel_log_count_' + channel._id)
    );
  });
}

Deps.autorun(subscribe_user_channel_logs);

/*
Function to subscribe to ChannelNicks collection.
ChannelNicks is a global collection (for all users) which contains
nick names present in each channel.
*/
subscribe_user_channel_nicks = function (channel) {
  if (!channel)
    return;
  /* 
  Subscribe to certain range of ChannelNicks for a UserChannel.

  The 4th argument of this call represents the from_nick: the nick from which
  to fetch next N channel nicks (alphabetically).

  The 5th argument of this call represents the to_nick: the nick before which
  we have to fetch N previous channel nicks (alphabetically).

  Only one of from_nick and to_nick is not null at a time. This is used to
  handle upwards and downards pagination of channel nicks for a channel.

  We paginate in showing channel nicks for a channel to make the client side
  faster and more memory efficient. This gracefully handles channels like
  #freenode with more that 1500 active channel nicks.
  */
  Meteor.subscribe(
    'channel_nicks', channel.user_server_name, channel.name,
    Session.get('lastNick-' + channel.user_server_name + '_' + channel.name),
    Session.get('startNick-' + channel.user_server_name + '_' + channel.name),
    function () {
        Meteor.setTimeout(
          function () {
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
              'currentLastNick-' + channel.user_server_name + '_' + channel.name,
              (last_nick || {}).nick);
            Session.set(
              'currentStartNick-' + channel.user_server_name + '_' + channel.name,
              (start_nick || {}).nick);
            if (Session.get(
              'startNick-' + channel.user_server_name + '_' + channel.name))
              $('#info-panel .nano').nanoScroller({scrollTop: 30});
          }, 500);
      }
    );
}

/* 
Automatically subscribe to ChannelNicks for newly joined UserChannels.
*/
UserChannels.find().observeChanges({
  added: function (id, channel) {
    console.log('Added new channel');
    console.log(channel);
    Deps.autorun(
      function () {
        subscribe_user_channel_nicks(channel);
      });
  }
});

/*
UserServers.find().observeChanges({
  added: function (id, user_server) {
    console.log('Added new server');
    console.log(user_server);
    Meteor.subscribe('server_nicks', function () {
      console.log('subscribed to server nicks');
      console.log(ServerNicks.find().count());
    });
  }
});
*/

/*
Function to subscribe to UserServerLogs for active UserServers.
*/
subscribe_user_server_logs = function () {
  UserServers.find().forEach(function (user_server) {
    Meteor.subscribe(
      "user_server_logs", user_server._id,
      Session.get('user_server_log_count_' + user_server._id),
      function () {
        console.log(UserServerLogs.find().count());
      }
    );
  });
}

Deps.autorun(subscribe_user_server_logs);

Template.header.events({
  'click #signout': function(){
    Meteor.logout(function (err) {
      Meteor.Router.to('/');
    });
  }
});

Template.content.events({
  'click .close[data-dismiss="alert"]': function (event) {
    Session.set($(event.currentTarget).data('sessionkey')); 
  }
});

Template.user_loggedout_content.show_signup_form = function(){
  return Session.get('showSignupFrom');
};

Template.signin_form.SigninError = function () {
  return Session.get('SigninFormError');
};

Template.signin_form.events({
  'click #signup-link': function (e){
    e.preventDefault();
    Session.set('showSignupFrom', true);
    Session.set('SigninFormError');
  },
  'submit form': function (e) {
    e.preventDefault();
    var user = $('#user-signin-username').val();
    var password = $('#user-signin-password').val();
    Meteor.loginWithPassword(user, password, function (err) {
      if (err)
        Session.set('SigninFormError', err);
      else
        Session.set('SigninFormError');
      Meteor.Router.to('/home');
    });
  }
});

Template.signup_form.events({
  'click #signin-link': function(e){
    e.preventDefault();
    Session.set('showSignupFrom', false);
    Session.set('SignupFormError');
  },
  'submit form': function(e){
    e.preventDefault();
    var username = $('#user-signup-username').val();
    var password = $('#user-signup-password').val();
    var email = $('#user-signup-email').val();
    var options = {username: username, email: email, password: password, profile: {}};
    Accounts.createUser(options, function(err){
      if (err) {
        Session.set('SignupFormError', err);
      } else {
        Session.set('SignupFormError');
      }
    });
  },
});

Template.signup_form.SignupError = function(){
  var err = Session.get('SignupFormError');
  if (err)
    return err;
};

updateHeight();

$(window).resize(updateHeight);


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

Accounts.ui.config({
  requestPermissions: {
    github: ['user', 'repo']
  },
  passwordSignupFields: 'USERNAME_AND_EMAIL'
});
