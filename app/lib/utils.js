messageContainsNick = function (text, nick) {
    var regex = new RegExp('\\b' + nick + '\\b');
    if (text.match(regex))
        return true;
    return false;
};

// FIXME: Need to move to Meteor Settings
/*
Default initial chat log count to load for each room.
A room may be a channel, server or PM room.
*/
DEFAULT_LOGS_COUNT = 30;