Accounts.validateNewUser(function (user) {
  if (Meteor.users.findOne({username: user.username}))
    throw new Meteor.Error(403, "User already exists.");
  return true;
});

Accounts.validateNewUser(function (user) {
  if (Meteor.users.findOne({'emails.address': user.email}))
    throw new Meteor.Error(403, "Email already exists.");
  return true;
});

Accounts.onCreateUser(function (options, user) {
  var result, profile;
  if (user.services.github) {
    var accessToken = user.services.github.accessToken;
    result = Meteor.http.get("https://api.github.com/user", {
      headers: {
          "User-Agent": "Meteor/1.0"
      },
      params: {
          access_token: accessToken
      }
    });
    if (result.error)
      throw result.error;
    profile = _.pick(result.data,
      "login", "name", "avatar_url", "url", "company", "blog",
      "email", "bio", "html_url");
    user.profile = profile;
    if (Meteor.users.findOne({username: profile.login}))
        user.username = profile.login + '@' + 'github';
    else
        user.username = profile.login;
  }
  if (!user.profile)
    user.profile = {};
  user.profile.connections = {};
  return user;
});

Accounts.config({
  sendVerificationEmail: true,
  forbidClientAccountCreation: false
});
