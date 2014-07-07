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
    message = message.replace(/<(.*?)>/g,'&lt;$1&gt;');
    // beacuse search results contain html for highlighting search terms
    message = message.replace('&lt;em class="hlt1"&gt;', '<em class="hlt1">');
    message = message.replace('&lt;/em&gt;', '</em>');
    return message;
  }

  if (message) {
    return new Spacebars.SafeString(
      linkify(escape_chevrons(message))
    );
  }
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

UI.registerHelper('isBookmarkable', function (from) {
  if (from)
    return true;
  else
    return false;
});

UI.registerHelper('isBookmarked', function (logId) {
  var userId = Meteor.user() && Meteor.user()._id;
  var cursor = Bookmarks.find({
    logIds: logId,
    userId: userId
  });
  if (cursor.count() > 0)
    return 'bookmarked';
  else
    return '';
});

var longpressTimerId = null;
var longpressed = false;

var generateBookmarkData = function () {
  var dateObjs = [];
  var logIds = [];
  var nowBookmarks = $('.bookmarked-now');
  // no bookmarks available, so return empty
  if (nowBookmarks.length == 0) {
    return '';
  }
  // bookmarks exists, so generate data
  for (var i=0; i<nowBookmarks.length; i++) {
    var nowBookmark = $(nowBookmarks[i]);
    var datetime = nowBookmark.data('datetime');
    var logId = nowBookmark.data('log-id');
    var dateObj = new Date(datetime);
    dateObjs.push(dateObj);
    logIds.push(logId);
  }
  dateObjs.sort(function (d1, d2) {
    return d1 - d2;
  });
  var startDate = dateObjs[0];
  var endDate = dateObjs[dateObjs.length - 1];
  var label = moment(startDate).format('LL hh:mm A');
  var labelEnd = moment(endDate).format('LL hh:mm A');
  if (label != labelEnd) {
    label += ' to ' + labelEnd;
  }
  return  {
    'label': label,
    'logIds': logIds
  }
};

var performBookmark = function (bookmarkEl) {
  var isBookmarked = bookmarkEl.hasClass('bookmarked');
  var isBookmarkedNow = bookmarkEl.hasClass('bookmarked-now');
  // this chat log was previously bookmarked, do nothing
  if (isBookmarked && !isBookmarkedNow) {
    return;
  }
  // this chat log was bookmarked now, so unbookmark it
  else if (isBookmarked && isBookmarkedNow) {
    bookmarkEl.removeClass('bookmarked bookmarked-now');
  }
  // this chat log is not bookmarked, so bookmark it
  else if (!isBookmarked) {
    bookmarkEl.addClass('bookmarked bookmarked-now');
  }
};

var bookmarkLogs = function (currentEl, longpressedEl) {
  if (longpressedEl && longpressedEl.get(0)) {
    var count = 0;
    var currentLogId = currentEl.data('log-id');
    var longpressedLogId = longpressedEl.data('log-id');
    var bookmarkEls = $('.chatlog-bookmark');
    for (var i=0; i<bookmarkEls.length; i++) {
      var bookmarkEl = $(bookmarkEls[i]);
      var logId = bookmarkEl.data('log-id');
      if (logId == currentLogId)
        count += 1;
      if (count > 0 && logId != longpressedLogId)
        performBookmark(bookmarkEl);
      if (logId == longpressedLogId)
        count += 1;
      if (count == 2) {
        $('.chatlog-bookmark').removeClass('longpressed');
        break;
      }
    }
  } else {
    performBookmark(currentEl);
  }
};

var doneBookmarking = function (event) {
  var data = event.data;
  var user = Meteor.user()
  var roomType = 'channel';
  data.creator = user.username;
  data.creatorId = user._id;
  data.user = user.username;
  data.userId = user._id;
  data.roomType = roomType;
  $("#done-bookmark").prop('disabled', true);
  Meteor.call('saveBookmarks', data, function (err, result) {
    $("#done-bookmark").prop('disabled', false);
    if (err || !result) {
      $('.bookmark-done-msg').removeClass('success error');
      $('.bookmark-done-msg').addClass('error');
      $('.bookmark-done-msg').text('OOPS! An error occured.');
      $('.bookmark-done-msg').show().delay(5000).hide(0);
    } else {
      $('.bookmark-model').hide();
      $('.chatlog-bookmark').removeClass('bookmarked-now');
      $('.bookmark-done-msg').removeClass('success error');
      $('.bookmark-done-msg').addClass('success');
      $('.bookmark-done-msg').text('Saved successfully.');
      $('.bookmark-done-msg').show().delay(5000).hide(0);
    }
  });
};

var cancelBookmarking = function (event) {
  $('.chatlog-bookmark').removeClass('bookmarked bookmarked-now');
  $('.bookmark-model').hide();
};

Template.chat_row.events = {
  'click .chatlog-bookmark': function (event) {
    var bookmarkEl = $(event.target).parent();
    var currentEl = bookmarkEl;
    var longpressedEl = null;
    if(longpressed && !bookmarkEl.hasClass('longpressed')){
      // remove class of any previous long pressed log
      $('.chatlog-bookmark').removeClass('longpressed');
      bookmarkEl.addClass('longpressed');
      bookmarkLogs(currentEl, longpressedEl);
    } else {
      longpressedEl = $('.longpressed');
      bookmarkLogs(currentEl, longpressedEl);
    }

    var bookmarkData = generateBookmarkData();
    if (bookmarkData) {
      $('#bookmark-label').attr('value', bookmarkData.label);
      $('#done-bookmark').off('click').on('click', bookmarkData, doneBookmarking);
      $('#cancel-bookmark').off('click').on('click', cancelBookmarking);
      $('.bookmark-model').show();
    } else {
      $('.bookmark-model').hide();
    }
  },

  // handles longpress logic
  'mousedown .chatlog-bookmark': function (event) {
    longpressed = false;
    longpressTimerId = setTimeout(function () {
      longpressed = true;
      console.log('longpressed');
    }, 1000);
  },

  'mouseup .chatlog-bookmark': function (event) {
    clearTimeout(longpressTimerId);
  }
};
