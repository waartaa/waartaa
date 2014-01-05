Template._loginButtonsLoggedInDropdown.created = function () {
  NProgress.start();
}

Template.add_server_modal.created = function () {
  NProgress.done();
}

Deps.autorun(updateHeight);


Template.chat_main.chat_logs = function () {
  var room_id = Session.get('room_id');
  if (Session.get('roomtype') == 'channel') {
    return UserChannelLogs.find({channel_id: room_id});
  } else if (Session.get('roomtype') == 'pm') {
    var nick = room_id.substr(room_id.indexOf('-') + 1);
    return PMLogs.find({
      $or: [
        {from: nick, to_user_id: Meteor.user()._id},
        {from_user_id: Meteor.user()._id, to: nick}
      ]
    });
  } else if (Session.get('roomtype') == 'server') {
    var server_id = Session.get('room_id');
    return UserServerLogs.find({server_id: server_id});
  }
}

Template.chat_main.topic = function () {
  try {
    var channel = UserChannels.findOne({_id: Session.get('room_id')});
    if (channel) {
      return channel.topic || "";
    }
  } catch (err) {
    return "";
  }
};

Template.chat_main.rendered = updateHeight;


Template.chat_row.rendered = function () {};


$(document).on(
  'scrollend.chat_logs_container', '.chat-logs-container',
  function (e) {
    var $table = $(e.target).find('.chatlogs-table');
    Session.set('chatlogsScrollEnd-' + $table.attr('id'), $table.scrollTop());
  });

function _getMatchingNicks (term) {
  var nicks = [];
  console.log(term);
  var channel = null;
  if (Session.get('roomtype') == 'channel') {
    channel = UserChannels.findOne({_id: Session.get('room_id')});
  }
  if (!channel)
    return;
  ChannelNickSugesstions.find(
    {
      nick: {$regex: '^' + term + '.+'},
      channel_name: channel.name,
      server_name: channel.user_server_name
    },
    {nick: 1}
  ).forEach(function (nick) {
    nicks.push(nick.nick);
  });
  return nicks;
}

ChannelNickSugesstions = new Meteor.Collection("channel_nick_suggestions");

function autocompleteNicksInitiate () {
  function split (val) {
    return val.split(/(^|[\ ]+)/ );
  }

  function extractLast ( term ) {
    return split(term).pop();
  }

  var auto_suggest = false;

  $('#chat-input')
    .bind('keydown', function (event) {
      if (Session.get('roomtype') != 'channel')
        return;
      if (event.keyCode === $.ui.keyCode.TAB) {
        event.preventDefault();
        if ($( this ).data( "ui-autocomplete" ).menu.active)
          return;
        auto_suggest = true;
        $('#chat-input').autocomplete('search', extractLast($(event.target).val()));
      } else if (event.keyCode === $.ui.keyCode.SPACE)
        auto_suggest = false;
    })
    .autocomplete({
      autoFocus: true,
      minLength: 1,
      source: function( request, response ) {
        // delegate back to autocomplete, but extract the last term
        var channel = UserChannels.findOne({_id: Session.get('room_id')});
        if (!channel)
          return;
        Meteor.subscribe(
          'channel_nick_suggestions', channel.user_server_name, channel.name,
          request.term, 10, function () {
            response( $.ui.autocomplete.filter(
              _getMatchingNicks(request.term), extractLast( request.term ) ) );
          }
        );
      },
      search: function (event, ui) {
        console.log(event);
        var $input = $('#chat-input');
        var val = $input.val() || "";
        console.log(auto_suggest);
        return auto_suggest;
      },
      focus: function() {
        // prevent value inserted on focus
        return false;
      },
      select: function( event, ui ) {
        var terms = split( this.value );
        // remove the current input
        terms.pop();
        // add the selected item
        terms.push( ui.item.value );
        this.value = terms.join( "" );
        if (this.value.length >= 1 && this.value[0] == "")
          this.value = this.value.substr(1);
        return false;
      },
      open: function($event, ui) {
          var $widget = $("ul.ui-autocomplete");
          var $input = $("#chat-input");
          var position = $input.position();

          var top_offset = $widget.find('li').length * 24;
          if (top_offset > 200)
            top_offset = 200;
          $("#chat-input-form").append($widget);
          $widget.width('auto')
            .css('max-height', 200)
            .css('overflow', 'auto')
            .css("left", position.left + $input.val().length * 6)
            .css("bottom", 36)
            .css("top", - top_offset - 2);
      }
    });
}

function refreshAutocompleteNicksSource () {
  $('chat-input').autocomplete('option', 'source', []);
}

function getChannelNicks () {
  var channel_nicks = [];
  var channel = UserChannels.findOne({_id: Session.get('room_id')}, {name: 1, user_server_name: 1}) || {};
  ChannelNicks.find({
    server_name: channel.user_server_name, channel_name: channel.name
  }).forEach(function (channel_nick) {
    channel_nicks.push(channel_nick.nick);
  });
  return channel_nicks;
} 

Handlebars.registerHelper("isCurrentRoom", function (room_id, room_type, server_id) {
  if (room_id == "ohB9cwuTsTnHMxT7T")
    return true;
  return false;
  /*
  var session_roomtype = Session.get('roomtype');
  var session_room_id = Session.get('room_id');
  var session_server_id = Session.get('server_id');
  if (session_roomtype = room_type && session_room_id == room_id && session_server_id == server_id)
    return true;
  return false;*/
});

/*Template.chat_main.rendered = function () {
  setTimeout(function () {
    updateHeight();
    var roomtype = Session.get('roomtype');
    var key = '';
    var room_id = Session.get('room_id');
    if (roomtype == 'channel')
      key = 'scroll_height_channel-' + room_id;
    else if (roomtype == 'pm')
      key = 'scroll_height_' + room_id;
    else if (roomtype == 'server')
      key = 'scroll_height_server-' + room_id;
    var chat_height = Session.get(key);
    //$('#chat-logs-container').scrollTop(chat_height || $('#chat-logs').height());
  }, 0);
};*/

Template.chat_main.destroyed = function () {
  var roomtype = Session.get('roomtype');
  if (roomtype == 'channel') {
    prefix = roomtype + '-';
    Session.set('scroll_height_' + prefix + Session.get('room_id'), $('#chat-logs-container').scrollTop());
  }
};

Client = {};

Meteor.subscribe("client", Meteor.user() && Meteor.user().username);

Template.chat_input.rendered = function () {
  autocompleteNicksInitiate();
}



//$('.editServerChannelLink').live('click', _handleServerChannelEditLinkClick);

Template.channel_menu.rendered = function (e) {
  //Template.channel_menu.events[
  //  'click .editServerChannelLink'] =  _handleServerChannelEditLinkClick;
}

Template.channel_logs.rendered = function () {
  //console.log("CREATED channel_logs");
};



Handlebars.registerHelper("activeChannels", function () {
  return UserChannels.find({active: true});
});

Handlebars.registerHelper("activeServers", function () {
  return UserServers.find();
});

cursors_observed = {};



var focussed = true;

window.onfocus = function () {
  focussed = true;
};

window.onblur = function () {
  focussed = false;
}

Handlebars.registerHelper("serverChatLogs", function (server_id) {
  var cursor = UserServerLogs.find(
    {server_id: server_id}, {sort: {created: 1}});
  var session_key = 'unreadLogsCountServer_' + server_id;
  cursor.observeChanges({
    added: function (id, fields) {
      Deps.nonreactive(function () {
        updateUnreadLogsCount(
          session_key, 'lastAccessedServer-' + fields.server_id,
          fields.last_updated)
      });
    }
  });
  return cursor;
});

$('.whois-tooltip, .tipsy-enable').tipsy({live: true, gravity: 'e', html: true});
$('#server-add-btn.enable-tipsy').tipsy({live: true, gravity: 's'});


Handlebars.registerHelper('current_server_away_msg', function () {
  var user_server =  UserServers.findOne({_id: Session.get('server_id')});
  if (user_server)
    return user_server.away_msg || "I'm not around.";
  return '';
});

function _submit_nick_away_data ($form) {
  var away_message = $form.find(
    '#nickAwayMessageInput').val() || "I'm not around.";
  var user_server = UserServers.findOne({_id: Session.get('server_id')});
  if (user_server)
    Meteor.call('mark_away', user_server.name, away_message, function (err) {
      console.log(err);
    });
}


Handlebars.registerHelper('isConnected', function (status) {
  if (status == 'connected')
    return true;
  else
    return false;
});

Handlebars.registerHelper('session', function (key) {
  return Session.get(key);
});



function logRenders () {
    _.each(Template, function (template, name) {
      var oldRender = template.rendered;
      var counter = 0;
 
      template.rendered = function () {
        console.log(name, "render count: ", ++counter);
        oldRender && oldRender.apply(this, arguments);
      };
    });
  }

logRenders();
