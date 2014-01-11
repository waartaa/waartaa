Handlebars.registerHelper("linkify", function (message) {
 return new Handlebars.SafeString(
   message.replace(waartaa.chat.helpers.LINK_REGEX, function(match) {
     return "<a target='_blank' href='" + match + "'>" + match + "</a>";
   })
 );
});

Handlebars.registerHelper('showDatetime', function (datetime_obj) {
  var today_str = moment(new Date()).format('MM/DD/YYYY');
  if (today_str == moment(datetime_obj).format('MM/DD/YYYY'))
    return moment(datetime_obj).format('hh:mm A');
  else
    return moment(datetime_obj).format('hh:mm A, DD MMM\'YY');
});

Handlebars.registerHelper('isToday', function (date_obj) {
  if (moment(new Date()).format('MM/DD/YYYY') == moment(date_obj).format('MM/DD/YYYY'))
    return true;
  return false;
});