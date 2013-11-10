//Servers = new Meteor.Collection("servers");
//Channels = new Meteor.Collection("channels");
//ChannelLogs = new Meteor.Collection("channel_logs");
//PMLogs = new Meteor.Collection("pm_logs");
//ServerLogs = new Meteor.Collection("server_logs");
//UserServers = new Meteor.Collection("user_servers");


DEFAULT_LOGS_COUNT = 10;

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
      var pm_nicks = user.profile.connections[user_server._id].pms;
      for (nick in pm_nicks) {
        var room_id = user_server._id + '_' + nick;
        Session.set('pmLogCount-' + room_id, DEFAULT_LOGS_COUNT);
      }
    });
    subscribe_user_server_logs();
    subscribe_pm_logs();
  });
  Meteor.subscribe("user_channels", function () {
    UserChannels.find({}).forEach(function (channel) {
      Session.set("user_channel_log_count_" + channel._id, DEFAULT_LOGS_COUNT);
    });
    subscribe_user_channel_logs();
  });
  Meteor.subscribe("user_channel_logs");
  Meteor.subscribe("user_server_logs");
  Meteor.subscribe("user_server_users");
};

subscribe();

subscribe_pm_logs = function () {
  var user = Meteor.user();
  UserServers.find().forEach(function (user_server) {
    var nicks = user.profile.connections[user_server._id].pms;
    for (nick in nicks) {
      var room_id = user_server._id + '_' + nick;
      Meteor.subscribe(
        'pm_logs_' + room_id,
        Session.get('pmLogCount-' + room_id),
        function () {
          console.log('PM logs count ' + PMLogs.find().count());
        }
      );
    }
  });
}

Deps.autorun(subscribe_pm_logs);

subscribe_user_channel_logs = function () {
  UserChannels.find({}).forEach(function (channel) {
    Meteor.subscribe(
      "user_channel_logs_" + channel._id,
      Session.get('user_channel_log_count_' + channel._id),
      function () {
        console.log(UserChannelLogs.find().count());
      }
    );
  });
}

Deps.autorun(subscribe_user_channel_logs);

subscribe_user_server_logs = function () {
  UserServers.find().forEach(function (user_server) {
    Meteor.subscribe(
      "user_server_logs_" + user_server._id,
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
    if (Meteor.userId) {
      location.href = "/home";
    } else
      return 'user_loggedout_content';
  },
  '/home': function () {
    Session.set('currentPage', 'home');
    return 'user_dashboard';
  },
  '/chat': function () {
    Session.set('currentPage', 'chat');
    return 'chat';
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
