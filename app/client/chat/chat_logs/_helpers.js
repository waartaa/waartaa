waartaa.chat.helpers.chatLogRowCreateHandler = function () {
    if (Session.get('shallUpdateHeight')) {
      Meteor.setTimeout(updateHeight, 0);
      Session.set('shallUpdateHeight');
    }
    var current_oldest_log_id_in_room = Session.get('oldest_log_id_in_room');
};

waartaa.chat.helpers.chatLogsTableCreateHandler = function () {
  Meteor.setTimeout(updateHeight, 0);
};

waartaa.chat.helpers.chatLogsWaypointHandler = function () {
  var $scrollUpElem = null;
  var $scrollDownElem = null;
  pageStack = null;
  pageStackLength = 3;

  function fetchOlderLogs (options) {
    var room = Session.get('room');
    options = options || {};
    var createdSortOrder = 1;
    if (options.currentPage) {
      createdSortOrder = -1;
    }
    var oldestLog = ChannelLogs.findOne(
      {channel_name: room.channel_name},
      {sort: {created: createdSortOrder}}
    );
    if (!oldestLog)
      return;
    if (options.currentPage && oldestLog) {
      pageStack = new Array();
      pageStack.push(oldestLog.created);
      Session.set('paginationStartTimestamp', oldestLog.created);
      Session.set('newRealtimeLogsSincePaginationStart', 0);
      waartaa.chat.ChatRoomRealtimeLogObserver = ChannelLogs.find(
        {
          channel_name: room.channel_name, server_name: room.server_name,
          created: {$gt: oldestLog.created}}).observeChanges({
            added: function (id, fields) {
              var newLogs = Session.get('newRealtimeLogsSincePaginationStart');
              if (newLogs == undefined || newLogs >= DEFAULT_LOGS_COUNT) {
                waartaa.chat.ChatRoomRealtimeLogObserver &&
                  waartaa.chat.ChatRoomRealtimeLogObserver.stop();
                if (typeof(newLogs) == "number") {
                  Session.set('newRealtimeLogsSincePaginationStart');
                  Session.set('showRealtimeLogs', false);
                }
                return;
              }
              Session.set('newRealtimeLogsSincePaginationStart', newLogs + 1);
            },
          });
    } else {
      pageStack = pageStack || new Array;
      if (pageStack.length > 0 &&
          oldestLog.created.toString() !=
          pageStack[pageStack.length - 1].toString()) {
        if (pageStack.length == pageStackLength) {
          pageStack.shift();
          Session.set('showRealtimeLogs', false);
        }
        pageStack.push(oldestLog.created);
        Session.set('paginationStartTimestamp', pageStack[0]);
      }
    }
    var currentPath = Router.current();
    var params = {
      from: moment(oldestLog.created).format(),
      direction: 'up',
      limit: DEFAULT_LOGS_COUNT,
    };
    var path = Router.routes['chatRoomChannel'].path({
      serverName: room.server_name,
      channelName: room.channel_name.substr(1)
    }, {
      query: params
    });
    console.log(path);
    Router.go(path);
  }
  return function () {
    var currentPath = Router.current();
    if (currentPath && !currentPath.params.from) {
      Session.set('paginationStartTimestamp');
      Session.set('showRealtimeLogs');
    }
    if ($scrollUpElem)
      $scrollUpElem.waypoint('destroy');
    if ($scrollDownElem)
      $scrollDownElem.waypoint('destroy');
    $scrollUpElem = $('.chatlogs-scroll-up')
      .waypoint(function (direction) {
        if (direction == 'up') {
          fetchOlderLogs();
        }
      }, {
        context: '.chat-logs-container',
        offset: -10
      });
    $scrollDownElem = $('.chatlogs-scroll-down')
      .waypoint(function (direction) {
        console.log(direction);
        if (direction == 'up') {
          var currentPath = Router.current();
          if (!currentPath.params.from) {
            fetchOlderLogs({currentPage: true});
          }
        }
      }, {
        context: '.chat-logs-container',
        offset: $('.chat-logs-container').outerHeight()
      });
  };
}();

waartaa.chat.helpers.chatLogRowRenderedHandler = function () {
  var last_log_id = Session.get('chatroom_last_log_id');
  var current_oldest_log_in_room = Session.get('oldest_log_in_room');
  if (last_log_id && last_log_id == this.data._id) {
    $('#chatlogs-loader:visible').fadeOut();
    Session.set('chatroom_last_log_id');
    updateHeight();
    if ( Session.get('scrollAtBottom') != false )
      $('.chat-logs-container').scrollTop($('.chatlogs-table').height());
  }
  var from = Router.current().params.from;
  if (from) {
    var fromTimestamp = new Date(moment(from));
    if (fromTimestamp > this.data.last_updated) {
      $('.chat-logs-container').scrollTo('#chatlog-' + from.replace(
        /:/gi, '_').replace('+', 'plus'), 0);
    }
  }
}

function _getOldestRealtimeLogForCurrentRoom () {
  var room = Session.get('room');
  if (room.roomtype == 'channel') {
    return ChannelLogs.findOne(
      {
        channel_name: room.channel_name,
        server_name: room.server_name
      }, {
        sort: {created: -1}, limit: 1,
        skip: DEFAULT_LOGS_COUNT - 1
      }
    );
  }
}

waartaa.chat.helpers.chatLogsContainerRendered = function () {
  updateHeight();
  $('.chat-logs-container').scrollTop($('.chatlogs-table').height());
}
