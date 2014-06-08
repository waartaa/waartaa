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
                var newPassword = $('#new-password').val();
                var rnewPassword = $('#retype-password').val();

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
            } else {
                $('.error').html('User is not authenticated');
                $('.error').removeClass('hidden');
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
