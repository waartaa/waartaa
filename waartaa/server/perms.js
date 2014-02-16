UserChannelLogs.allow({
  insert: function (userId, log) {
    log.status = 'sent';
    var user = Meteor.users.findOne({_id: userId});
    Meteor.setTimeout(function () {
        _send_channel_message(
        user, log.channel_id, log.message, {log: false});
    }, 5);
    if (log.message[0] == '/')
        return false;
    return true;
  }
});