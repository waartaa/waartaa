UI.registerHelper('channel_to_edit', function (e) {
  var channel = UserChannels.findOne({_id: Session.get('channel_id_to_edit')});
  if (channel) {
    channel.password = channel.password || '';
    return channel;
  }
});

Template.server_channels.channels = function (server_id) {
  return UserChannels.find(
    {user_server_id: server_id, active: true},
    {
      fields: {last_updated: 0},
      sort: {name: 1}
    });
}

function serverChannelsCreatedCallback () {
  updateHeight();
}

Template.server_channels.created = serverChannelsCreatedCallback;

Template.server_channel_item.created = function () {
  Session.set("lastAccessedChannel-" + this.data._id, new Date());
};

Template.server_channel_item.helpers({
  isChannelActive: function () {
    var room = Session.get('room') || {};
    if (room.roomtype == 'channel' && room.server_id == this.user_server_id &&
        room.room_id == this._id)
      return true;
  }
});

Template.channel_menu.events({
  'click .channel-remove': function (e) {
    var channel_id = $(e.target).data("channel-id");
    var channel = UserChannels.findOne({_id: channel_id});
    Meteor.call(
      "part_user_channel", channel.user_server_name, channel.name, true);
  },
  'click .editServerChannelLink': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $this = $(e.target);
    var channel_id = $this.data('channel-id');
    Session.set('channel_id_to_edit', channel_id);
    var $modal_content = $('#editServerChannel-' + channel_id);
    Meteor.setTimeout(function () {
      $modal_content.modal().on(
        'shown.bs.modal', function (e) {
          $modal_content.find('[name="password"]').focus();
        })
        .on('hidden.bs.modal', function (e) {
          $('#chat-input').focus();
        })
      ;
    }, 4);
  },
  'click .toggleJoinChannel': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $this = $(e.currentTarget);
    var channel_id = $this.data('channel-id');
    var channel = UserChannels.findOne({_id: channel_id});
    var status = $this.attr('data-status');
    if (status == 'connected')
      Meteor.call(
        "part_user_channel", channel.user_server_name, channel.name, false);
    else
      Meteor.call('join_user_channel', channel.user_server_name, channel.name);
  }
});

Template.edit_server_channel.events = {
  'submit .editServerChannel': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $form = $(e.target);
    var data = {'password': $form.find('[name="password"]').val() || ''};
    Meteor.call('edit_user_channel', $form.data('channel-id'), data, function (err) {
      $form.parents('.modal').modal('hide');
    })
  }
};
  
Template.server_channels.created = function(){
  // takes in key of a cookie and returns its value, null if not present
  var get_cookie = function(key) {
    var cookies = document.cookie.split(';');
    for( var i = 0 ; i < cookies.length ; i++ ) {
      var cookie = cookies[i].trim();
      var seperator = cookie.indexOf('=');
      var cookie_key = cookie.substring(0, seperator);
      if( cookie_key == key ) {
        cookie_value = cookie.substring(seperator+1);
        return cookie_value;
      }
    }
    return null;
  };

  var highlight_room = function() {
    // highlights the html element of the current room
    var room = Session.get('room');
    if (!room)
      return;
    var room_id = room.room_id;
    var roomtype = room.roomtype;
    var activate_link = '#' + roomtype + 'Link-' + room_id;
    $(activate_link).parent().addClass('active');
  };

  var session_room_exists = function() {
    // checks for the presence of a the room in Session variable 'room'
    var room = Session.get('room');
    if(room === undefined)
      return false;

    if(room.roomtype == 'server')
      return UserServers.findOne({'_id' : room.room_id}) !== undefined;
    else if(room.roomtype == 'channel')
      return UserChannels.findOne({'_id' : room.room_id}) !== undefined;
    else if(room.roomtype == 'pm') {
      var UserPm = UserPms.findOne({'user_server_id' : room.room_id});
      if(UserPm === undefined)
        return false;
      if(Object.keys(UserPm.pms).indexOf(room.nick) != -1)
          return true;
        else
          return false;
    }
  };

  // connected becomes true only if waartaa connects to room with data from
  // cookies
  var connected = false;
  var previous_userId = get_cookie('userId');

  if(previous_userId == Meteor.userId()) {
    // collecting data from cookies only if user matches
    // setting channel if appropriate cookies are available
    try {
      var roomtype = get_cookie('roomtype');
      var server_id = get_cookie('server_id');
      // trying to set room with data available from cookies, if this fails,
      // waartaa will connect to the first room available in the first server
      if(roomtype == 'server') {
        var server = UserServers.findOne({'_id':server_id}) || {};
        if(server.status == 'connected' || channel_status == 'connecting') {
          waartaa.chat.helpers.setCurrentRoom({
            roomtype : roomtype,
            server_id : server_id,
            server_name: server.name
          });
          connected = true;
        }
      }
      else if(roomtype == 'channel') {
        var channel_id = get_cookie('channel_id');
        var channel = UserChannels.findOne({'_id':channel_id}) || {};
        if(channel.status == 'connected' || channel.status == 'connecting') {
          waartaa.chat.helpers.setCurrentRoom({
               roomtype: roomtype,
               server_id: server_id,
               channel_id: channel_id,
               channel_name: channel.name,
               server_name: channel.user_server_name
          });
          connected = true;
        }
      }
      else if(roomtype == 'pm') {
        var pm_nick = get_cookie('pm_nick');
        var pms = UserPms.findOne({ user_server_id: server_id });
        var pm_connected = '';
        if(Object.keys(pms.pms).indexOf(pm_nick) != -1)
          pm_connected = 'connected';
        else
          pm_connected = 'disconnected';

        if(pm_connected == 'connected') {
          var server = UserServers.findOne({'_id':server_id});
          waartaa.chat.helpers.setCurrentRoom({
            nick: pm_nick,
            server_id: server_id,
            roomtype: roomtype,
            server_name: server.name,
          });
          connected = true;
        }
      }
      highlight_room();
    } catch (err) {
      console.log(err);
    }
  }

  if(!connected) {
    // waartaa couldn't connect to a chat room with data from the cookies,
    // connecting to the first room availble
    try {
      var server = UserServers.findOne();
      var server_id = server._id;
      var channels = UserChannels.find({ user_server_id : server_id });
      var pm = UserPms.findOne({ user_server_id: server_id });
      var pm_count = 0;
      if(pm !== undefined)
        pm_count = Object.keys(pm.pms).length;

      if(UserServers.find().count() > 0 && !session_room_exists()) {
        if ( channels.count() === 0 && pm_count === 0) {
          // no channels and no pms, connecting to server room
          server.roomtype = 'server';
          waartaa.chat.helpers.setCurrentRoom(server);
        }
        else if(channels.count() > 0 ) {
          // connect the first room
          var channel_objects = channels.db_objects;
          var channel_name = channel_objects[0].name;
          
          // find the name on the channel shown on top in html template
          for(var i = 1 ; i < channel_objects.length ; i++) {
            if(channel_objects[i].name < channel_name) {
              channel_name = channel_objects[i].name;
            }
          }
          // now we know the name of the channel to connect, looking up
          // UserChannels collection for the channel object
          var channel = UserChannels.findOne({name:channel_name});
          // connecting to the channel
          waartaa.chat.helpers.setCurrentRoom({
               roomtype: 'channel',
               server_id: channel.user_server_id,
               channel_id: channel._id,
               channel_name: channel.name,
               server_name: channel.user_server_name
          });
        }
        else {
          // connect to the first pm
          var first_nick = Object.keys(pm.pms)[0];
          waartaa.chat.helpers.setCurrentRoom({
            nick: nick,
            server_id: server_id,
            roomtype: 'pm'
          });
        }
      }
      highlight_room();
    } catch (err) {
      console.log(err);
    }
  }
};
