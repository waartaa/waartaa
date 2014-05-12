function getUserEmail (user) {
  if (user.emails)
    return user.emails[0].address;
  else
    return (user.profile || {}).email;
}

waartaa = typeof(waartaa) == 'undefined'? {}: waartaa;

waartaa.notifications = {
  notify_channel_mention: function (user, channel, nick, text) {
    try {
      var options = {
        from: 'waartaa <no-reply@waartaa.com>',
        to: getUserEmail(user),
        subject: nick + ' mentioned you in ' + channel.name + ', ' +
          channel.user_server_name,
        text: 'Hi,\n\n' +
          '@' + nick + ' mentioned you in ' + channel.name + ', ' +
          channel.user_server_name + ':\n\n' +
          text + '\n\n' +
          'Regards,\n' +
          'The waartaa team\n' +
          Meteor.absoluteUrl() + '\n'
      };
      logger.info(options);
      Email.send(options);
    } catch (err) {
      logger.error(err);
    }
  },
  notify_pm: function (user, nick, text, user_server) {
    try {
      var options = {
        from: 'waartaa <no-reply@waartaa.com>',
        to: getUserEmail(user),
        subject: nick + ' has sent you a message in ' + user_server.name,
        text: 'Hi,\n\n' +
          '@' + nick + ' has sent you a message in ' +
          user_server.name + ':\n\n' +
          text + '\n\n' +
          'Regards,\n' +
          'The waartaa team\n' +
          Meteor.absoluteUrl() + '\n'
      };
      logger.info(options);
      Email.send(options);
    } catch (err) {
      logger.error(err);
    }
  }
};
