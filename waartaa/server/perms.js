ChannelLogs.allow({
  insert: function (userId, log) {
    log.status = 'sent';
    var user = Meteor.users.findOne({_id: userId});
    var log_options = {log: false};
    if (log.message.search('/whois') == 0) {
        log_options.room_id = log.channel_id;
        log_options.roomtype = 'channel';
    }
    _send_channel_message(
    user, log.channel_id, log.message, log_options);
    if (log.message.substr(0, 3) == '/me') {
        log.message = log.message.replace('/me', log.from);
        log.from = null;
    } else if (log.message[0] == '/')
        return false;
    return true;
  }
});
