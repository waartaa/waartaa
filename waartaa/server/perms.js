UserChannelLogs.allow({
  insert: function (userId, log) {
    log.status = 'sent';
    log.created = new Date();
    log.last_updated = new Date();
    var user = Meteor.users.findOne({_id: userId});
    return _send_channel_message(
        user, log.channel_id, log.message, {log: false});
  }
});