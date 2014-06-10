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

    Template.accountSettings.formMessage = function(){
        return Session.get('formMessage');
    };

    Template.accountSettings.events({
        'click #btn-change-password': function(e) {
            var user = Meteor.user();
            event.preventDefault();
            if (user) {
                var currentPassword = $('#current-password').val();
                var newPassword = $('#new-password').val().trim();
                var rnewPassword = $('#retype-password').val().trim();

                // Check if the password is more than 6 characters
                if (newPassword.length < 8) {
                    Session.set('formMessage', 'Password less than 8 characters');
                } else {
                    if (newPassword == rnewPassword) {
                        Accounts.changePassword(currentPassword, newPassword, function(e){
                            if(e) {
                                Session.set('formMessage', 'Incorrect Password');
                            } else {
                                Session.set('formMessage', 'Password Changed');
                            }
                        });
                    } else {
                        Session.set('formMessage', 'Password do not match');
                    }
                }
            } else {
                Session.set('formMessage', 'User is not authenticated');
            }
        }
    });

    Template.accountSettings.events({
        'click #btn-change-email': function(e) {
            var userId = Meteor.userId()
            event.preventDefault();
            if (userId) {
                 var email = $('#new-email').val();
                 Meteor.call('change_email', userId, email);
            }
        }
    });
})();
