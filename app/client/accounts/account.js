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

})();
