(function() {
    Template._navLoginButtons.events({
        'click #login-buttons-logout': function() {
            Meteor.logout();
        }
    });

    Template._navLoginButtons.displayUserName = function () {
        var user = Meteor.user();
        if (!user)
            return '';

        if (user.username)
            return user.username;

        return '';
    };

    Template.account_settings.events = {
        'click input[type=submit]#btn-change-password': function(e) {
            e.preventDefault();
            var user = Meteor.user();
            if (user) {
                var currentPassword = $('current-password').val();
                var newPassword = $('new-password').val();
                var rnewPassword = $('retype-password').val();

                if (newPassword == rnewPassword) {
                    Accounts.changePassword(currentPassword, newPassword);
                } else {
                    Meteor.Error(403, "Password do not match");
                }
            } else {
                Meteor.Error(404, "User is not authenticated");
            }
        }
    }
})();
