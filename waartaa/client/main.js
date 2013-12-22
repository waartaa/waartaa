//Servers = new Meteor.Collection("servers");
//Channels = new Meteor.Collection("channels");
//ChannelLogs = new Meteor.Collection("channel_logs");
//PMLogs = new Meteor.Collection("pm_logs");
//ServerLogs = new Meteor.Collection("server_logs");
//UserServers = new Meteor.Collection("user_servers");


DEFAULT_LOGS_COUNT = 40;

subscribe = function () {
  Meteor.subscribe("servers");
  Meteor.subscribe("channels");
  Meteor.subscribe("channel_logs");
  Meteor.subscribe("pm_logs");
  Meteor.subscribe("user_servers", function () {
    UserServers.find().forEach(function (user_server) {
      Session.set(
        "user_server_log_count_" + user_server._id, DEFAULT_LOGS_COUNT);
      var user = Meteor.user();
      var pm_nicks = (
        user.profile.connections[user_server._id] || {}).pms || [];
      for (nick in pm_nicks) {
        var room_id = user_server._id + '_' + nick;
        Session.set('pmLogCount-' + room_id, DEFAULT_LOGS_COUNT);
      }
    });
    subscribe_user_server_logs();
    subscribe_pm_logs();
    subscribe_server_nicks_for_pms();
  });
  Meteor.subscribe("user_channels", function () {
    UserChannels.find({}).forEach(function (channel) {
      Session.set("user_channel_log_count_" + channel._id, DEFAULT_LOGS_COUNT);
    });
    subscribe_user_channel_logs();
  });
  Meteor.subscribe("user_channel_logs");
  Meteor.subscribe("user_server_logs");
  Meteor.subscribe("server_nicks");
  //Meteor.subscribe('channel_nicks');
};

subscribe();

subscribe_pm_logs = function () {
  var user = Meteor.user();
  UserServers.find().forEach(function (user_server) {
    var nicks = (user.profile.connections[user_server._id] || {}).pms || [];
    for (nick in nicks) {
      var room_id = user_server._id + '_' + nick;
      Meteor.subscribe(
        'pm_logs', room_id,
        Session.get('pmLogCount-' + room_id),
        function () {
          //console.log('PM logs count ' + PMLogs.find().count());
        }
      );
    }
  });
}

Deps.autorun(subscribe_pm_logs);

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

subscribe_user_channel_logs = function () {
  UserChannels.find({}).forEach(function (channel) {
    Meteor.subscribe(
      "user_channel_logs", channel._id,
      Session.get('user_channel_log_count_' + channel._id),
      function () {
        console.log(UserChannelLogs.find().count());
      }
    );
  });
}

subscribe_user_channel_nicks = function (channel) {
  if (!channel)
    return;
  Meteor.subscribe(
    'channel_nicks', channel.user_server_name, channel.name,
    Session.get('lastNick-' + channel.user_server_name + '_' + channel.name),
    Session.get('startNick-' + channel.user_server_name + '_' + channel.name),
    function () {
        console.log('subscribed to channel nicks');
        console.log(ChannelNicks.find().count());
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
            console.log('LAST channel nick: ' + (last_nick || {}).nick);
            console.log('START channel nick: ' + (start_nick || {}).nick);
            Session.set(
              'currentLastNick-' + channel.user_server_name + '_' + channel.name,
              (last_nick || {}).nick);
            Session.set(
              'currentStartNick-' + channel.user_server_name + '_' + channel.name,
              (start_nick || {}).nick);
          }, 500);
      }
    );
}

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


Deps.autorun(subscribe_user_channel_logs);

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

Clients = new Meteor.Collection("clients");
//Meteor.subscribe("clients");

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
