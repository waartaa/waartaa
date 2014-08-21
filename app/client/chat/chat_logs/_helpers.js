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
    if (options.currentPage)
      Session.set('paginationStartLog', oldestLog);
    var currentPath = Router.current();
    var params = {
      from: moment(oldestLog.created).format(),
      direction: 'up',
      limit: DEFAULT_LOGS_COUNT,
    };
    if (currentPath.params.realtime)
      params.realtime = currentPath.params.realtime;
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

waartaa.chat.helpers.chatLogRowDestroyedHandler = function () {
  var room = Session.get('room');
  var paginationStartLog = Session.get('paginationStartLog');
  if (!paginationStartLog)
    return;
  var oldestRealtimeLog = _getOldestRealtimeLogForCurrentRoom();
  if (oldestRealtimeLog &&
      paginationStartLog.last_updated < oldestRealtimeLog.last_updated) {
    var currentPath = Router.current();
    var path = Router.routes['chatRoomChannel'].path({
      serverName: room.server_name,
      channelName: room.channel_name.substr(1)
    }, {
      query: {
        from: currentPath.params.from,
        direction: currentPath.params.direction,
        limit: currentPath.params.limit,
        realtime: false
      }
    });
    Router.go(path);
  }

}

waartaa.chat.helpers.chatLogsContainerRendered = function () {
  updateHeight();
  $('.chat-logs-container').scrollTop($('.chatlogs-table').height());
}
