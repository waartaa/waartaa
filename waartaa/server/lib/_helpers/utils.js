messageContainsNick = function (text, nick) {
    var regex = new RegExp('\\b' + nick + '\\b');
    if (text.match(regex))
        return true;
    return false;
};