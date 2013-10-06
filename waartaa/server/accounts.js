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
  user.profile = user_profiles && user_profiles[user.username] || null;
  return user;
});
