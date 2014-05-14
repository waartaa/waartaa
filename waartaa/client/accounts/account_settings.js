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

    Template.accountSettings.events({
        'click #btn-change-password': function(e) {
            var user = Meteor.user();
            event.preventDefault();
            $('.error').addClass('hidden');
            if (user) {
                var currentPassword = $('#current-password').val();
                var newPassword = $('#new-password').val();
                var rnewPassword = $('#retype-password').val();

                if (newPassword == rnewPassword) {
                    Accounts.changePassword(currentPassword, newPassword, function(e){
                        console.log(e);
                    });
                } else {
                    $('.error').html('Password do not match');
                    $('.error').removeClass('hidden');
                }
            } else {
                $('.error').html('User is not authenticated');
                $('.error').removeClass('hidden');
            }
        }
    });
})();
