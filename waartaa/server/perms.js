UserChannelLogs.allow({
  insert: function (userId, log) {
    console.log(log);
    log.status = 'sent';
    console.log('+++++USERID+++++', userId);
    var user = Meteor.users.findOne({_id: userId});
    console.log(user);
    return _send_channel_message(
        user, log.channel_id, log.message, {log: false});
  }
});