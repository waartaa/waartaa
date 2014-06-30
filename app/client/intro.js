Template.intro.events = {
  'click #waartaa-try-btn': function (e) {
    e.preventDefault();
    e.stopPropagation();
    $('#login-dropdown-list .dropdown-toggle').click();
  }
};

var loginButtonsSession = Accounts._loginButtonsSession;

Template.loginButtonsLoggedOut.events({
  'click #login-buttons-password': function() {
    loginOrSignup();
  },

  'keypress #forgot-password-email': function(event) {
    if (event.keyCode === 13)
      forgotPassword();
  },

  'click #login-buttons-forgot-password': function(event) {
    event.stopPropagation();
    forgotPassword();
  },

  'click #signup-link': function(event) {
    event.stopPropagation();
    loginButtonsSession.resetMessages();

    // store values of fields before swtiching to the signup form
    var username = trimmedElementValueById('login-username');
    var email = trimmedElementValueById('login-email');
    var usernameOrEmail = trimmedElementValueById('login-username-or-email');
    // notably not trimmed. a password could (?) start or end with a space
    var password = elementValueById('login-password');

    loginButtonsSession.set('inSignupFlow', true);
    loginButtonsSession.set('inForgotPasswordFlow', false);

    // force the ui to update so that we have the approprate fields to fill in
    Meteor.flush();

    // update new fields with appropriate defaults
    if (username !== null)
      document.getElementById('login-username').value = username;
    else if (email !== null)
      document.getElementById('login-email').value = email;
    else if (usernameOrEmail !== null)
      if (usernameOrEmail.indexOf('@') === -1)
        document.getElementById('login-username').value = usernameOrEmail;
      else
        document.getElementById('login-email').value = usernameOrEmail;
  },
  'click #forgot-password-link': function(event) {
    event.stopPropagation();
    loginButtonsSession.resetMessages();

    // store values of fields before swtiching to the signup form
    var email = trimmedElementValueById('login-email');
    var usernameOrEmail = trimmedElementValueById('login-username-or-email');

    loginButtonsSession.set('inSignupFlow', false);
    loginButtonsSession.set('inForgotPasswordFlow', true);

    // force the ui to update so that we have the approprate fields to fill in
    Meteor.flush();
    //toggleDropdown();

    // update new fields with appropriate defaults
    if (email !== null)
      document.getElementById('forgot-password-email').value = email;
    else if (usernameOrEmail !== null)
      if (usernameOrEmail.indexOf('@') !== -1)
        document.getElementById('forgot-password-email').value = usernameOrEmail;
  },
  'click #back-to-login-link': function() {
    loginButtonsSession.resetMessages();

    var username = trimmedElementValueById('login-username');
    var email = trimmedElementValueById('login-email') || trimmedElementValueById('forgot-password-email'); // Ughh. Standardize on names?

    loginButtonsSession.set('inSignupFlow', false);
    loginButtonsSession.set('inForgotPasswordFlow', false);

    // force the ui to update so that we have the approprate fields to fill in
    Meteor.flush();

    if (document.getElementById('login-username'))
      document.getElementById('login-username').value = username;
    if (document.getElementById('login-email'))
      document.getElementById('login-email').value = email;
    // "login-password" is preserved thanks to the preserve-inputs package
    if (document.getElementById('login-username-or-email'))
      document.getElementById('login-username-or-email').value = email || username;
  },
  'keypress #login-username, keypress #login-email, keypress #login-username-or-email, keypress #login-password, keypress #login-password-again': function(event) {
    if (event.keyCode === 13)
      loginOrSignup();
  }
});

// Helpers

var elementValueById = function(id) {
  var element = document.getElementById(id);
  if (!element)
    return null;
  else
    return element.value;
};

var trimmedElementValueById = function(id) {
  var element = document.getElementById(id);
  if (!element)
    return null;
  else
    return element.value.replace(/^\s*|\s*$/g, ""); // trim;
};

var loginOrSignup = function() {
  if (loginButtonsSession.get('inSignupFlow'))
    signup();
  else
    login();
};

var login = function() {
  loginButtonsSession.resetMessages();

  var username = trimmedElementValueById('login-username');
  var email = trimmedElementValueById('login-email');
  var usernameOrEmail = trimmedElementValueById('login-username-or-email');
  // notably not trimmed. a password could (?) start or end with a space
  var password = elementValueById('login-password');

  var loginSelector;
  if (username !== null) {
    if (!Accounts._loginButtons.validateUsername(username))
      return;
    else
      loginSelector = {
        username: username
      };
  } else if (email !== null) {
    if (!Accounts._loginButtons.validateEmail(email))
      return;
    else
      loginSelector = {
        email: email
      };
  } else if (usernameOrEmail !== null) {
    // XXX not sure how we should validate this. but this seems good enough (for now),
    // since an email must have at least 3 characters anyways
    if (!Accounts._loginButtons.validateUsername(usernameOrEmail))
      return;
    else
      loginSelector = usernameOrEmail;
  } else {
    throw new Error("Unexpected -- no element to use as a login user selector");
  }

  Meteor.loginWithPassword(loginSelector, password, function(error, result) {
    if (error) {
      loginButtonsSession.errorMessage(error.reason || "Unknown error");
    } else {
      loginButtonsSession.closeDropdown();
    }
  });
};

var toggleDropdown = function() {
  $('#login-dropdown-list .dropdown-menu').dropdown('toggle');
};

var signup = function() {
  loginButtonsSession.resetMessages();

  var options = {}; // to be passed to Accounts.createUser

  var username = trimmedElementValueById('login-username');
  if (username !== null) {
    if (!Accounts._loginButtons.validateUsername(username))
      return;
    else
      options.username = username;
  }

  var email = trimmedElementValueById('login-email');
  if (email !== null) {
    if (!Accounts._loginButtons.validateEmail(email))
      return;
    else
      options.email = email;
  }

  // notably not trimmed. a password could (?) start or end with a space
  var password = elementValueById('login-password');
  if (!Accounts._loginButtons.validatePassword(password))
    return;
  else
    options.password = password;

  if (!matchPasswordAgainIfPresent())
    return;

  // prepare the profile object
  options.profile = {};

  // define a proxy function to allow extraSignupFields set error messages
  var errorFn = function(errorMessage) {
    Accounts._loginButtonsSession.errorMessage(errorMessage);
  };

  var invalidExtraSignupFields = false;

  // parse extraSignupFields to populate account's profile data
  _.each(Accounts.ui._options.extraSignupFields, function(field, index) {
    var value = elementValueById('login-' + field.fieldName);
    if (typeof field.validate === 'function') {
      if (field.validate(value, errorFn)) {
        options.profile[field.fieldName] = elementValueById('login-' + field.fieldName);
      } else {
        invalidExtraSignupFields = true;
      }
    } else {
      options.profile[field.fieldName] = elementValueById('login-' + field.fieldName);
    }
  });

  if (invalidExtraSignupFields)
    return;

  Accounts.createUser(options, function(error) {
    if (error) {
      loginButtonsSession.errorMessage(error.reason || "Unknown error");
    } else {
      loginButtonsSession.closeDropdown();
    }
  });
};

var forgotPassword = function() {
  loginButtonsSession.resetMessages();

  var email = trimmedElementValueById("forgot-password-email");
  if (email.indexOf('@') !== -1) {
    Accounts.forgotPassword({
      email: email
    }, function(error) {
      if (error)
        loginButtonsSession.errorMessage(error.reason || "Unknown error");
      else
        loginButtonsSession.infoMessage("Email sent");
    });
  } else {
    loginButtonsSession.infoMessage("Email sent");
  }
};

var changePassword = function() {
  loginButtonsSession.resetMessages();

  // notably not trimmed. a password could (?) start or end with a space
  var oldPassword = elementValueById('login-old-password');

  // notably not trimmed. a password could (?) start or end with a space
  var password = elementValueById('login-password');
  if (!Accounts._loginButtons.validatePassword(password))
    return;

  if (!matchPasswordAgainIfPresent())
    return;

  Accounts.changePassword(oldPassword, password, function(error) {
    if (error) {
      loginButtonsSession.errorMessage(error.reason || "Unknown error");
    } else {
      loginButtonsSession.infoMessage("Password changed");

      // wait 3 seconds, then expire the msg
      Meteor.setTimeout(function() {
        loginButtonsSession.resetMessages();
      }, 3000);
    }
  });
};

var matchPasswordAgainIfPresent = function() {
  // notably not trimmed. a password could (?) start or end with a space
  var passwordAgain = elementValueById('login-password-again');
  if (passwordAgain !== null) {
    // notably not trimmed. a password could (?) start or end with a space
    var password = elementValueById('login-password');
    if (password !== passwordAgain) {
      loginButtonsSession.errorMessage("Passwords don't match");
      return false;
    }
  }
  return true;
};
