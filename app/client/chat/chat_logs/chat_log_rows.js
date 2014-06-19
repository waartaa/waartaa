UI.registerHelper("checkOwnNickInMsg", function (message, current_nick, from) {
  var pattern=new RegExp("(^|[^\\d\\w])"+current_nick+"(^|[^\\d\\w])");
  if(message.match(pattern) && from)
    return true;
  return false;
});

UI.registerHelper("decorate", function (message) {
  function linkify (message) {
    return message.replace(waartaa.chat.helpers.LINK_REGEX, function(match) {
      return "<a target='_blank' href='" + match + "'>" + match + "</a>";
    });
  }

  function escape_chevrons (message) {
      return message.replace(/<(.*)>/g,'&lt;$1&gt;');
  }

  if (message)
    return new Spacebars.SafeString(
      linkify(escape_chevrons(message))
    );
});

UI.registerHelper('showDatetime', function (datetime_obj) {
  var today_str = moment(new Date()).format('MM/DD/YYYY');
  if (today_str == moment(datetime_obj).format('MM/DD/YYYY'))
    return moment(datetime_obj).format('hh:mm A');
  else
    return moment(datetime_obj).format('hh:mm A, DD MMM\'YY');
});

UI.registerHelper('isToday', function (date_obj) {
  if (moment(new Date()).format('MM/DD/YYYY') == moment(date_obj).format('MM/DD/YYYY'))
    return true;
  return false;
});
