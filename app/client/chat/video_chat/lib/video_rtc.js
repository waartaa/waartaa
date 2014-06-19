VideoChat = (function () {

  var options = {};

  var connectSuccessCB = function (id) {
    Session.set('selfEasyrtcId', id);
    Session.set('easyrtcStatus', 'connected');
  };

  var connectErrorCB = function () {
    Session.set('selfEasyrtcId', '');
    Session.set('easyrtcStatus', 'disconnected');
  };

  var disconnectListener = function () {
    Session.set('selfEasyrtcId');
    Session.set('otherEasyrtcId');
    Session.set('easyrtcStatus', 'connecting');
  };

  var roomListener = function (roomName, listeners) {
    var data = [];
    var exists = {};
    for (var listener in listeners) {
      var name = easyrtc.idToName(listener);
      if (Meteor.user().username != name && !exists.name) {
        data.push({
          id: listener,
          name: name
        });
        exists.name = name;
      }
    }
    Session.set('videoUsersList', data);
  };

  var acceptedCB = function (accepted, easyrtcId) {
    if (accepted) {
      Session.set('otherEasyrtcId', easyrtcId);
    } else {
      var username = easyrtc.idToName(easyrtcId);
      $('.errMsg').text('Your call was rejected by ' + username);
      $('.errMsg').show().delay(5000).fadeOut();
    }
    Session.set('videoCallingId');
  };

  var successCB = function () {
    self.renderLocalStream();
  };

  var errorCB = function () {
    Session.set('videoCallingId');
  };

  var acceptChecker = function (easyrtcId, CB) {
    $('#call-accept-container').show();

    var acceptMsg = 'Accept video call from ';
        acceptMsg += easyrtc.idToName(easyrtcId) + '?';

    if (easyrtc.getConnectionCount() > 0) {
      acceptMsg += ' Previous hangout will be disconnected.';
    }

    $('.call-accept-label').text(acceptMsg);

    var mediaSuccessCB = function () {
      CB(true);
      Session.set('otherEasyrtcId', easyrtcId);
    };

    var mediaErrorCB = function (errCode, errText) {
      $('.errMsg').text(errText);
      $('.errMsg').show().delay(5000).fadeOut();
    };

    var acceptTheCall = function() {
      $('#call-accept-container').hide();
      if (Session.get('room').roomtype != 'video') {
        $('#video-server-link').click();
      }
      if (easyrtc.getLocalStream()) {
        mediaSuccessCB();
      } else {
        easyrtc.initMediaSource(mediaSuccessCB, mediaErrorCB);
      }
    };

    var rejectTheCall = function () {
      $('#call-accept-container').hide();
      CB(false);
    };

    // First unbind then bind again click event
    // to prevent triggering it twice
    $('#call-accept-btn').off('click').on('click', function () {
      acceptTheCall();
    });
    $('#call-reject-btn').off('click').on('click', function () {
      rejectTheCall();
    });
  };

  var streamAcceptor = function (easyrtcId, stream) {
    self.remoteStream = stream;
    self.renderLocalStream();
    self.renderRemoteStream();
  };

  var onStreamClosed = function (easyrtcId) {
    if (Session.get('otherEasyrtcId') == easyrtcId) {
      Session.set('otherEasyrtcId');
      Session.set('videoCallingId');
      self.remoteStream = '';
      self.resetRemoteVideoObj();
    }
  };

  var self = {
    haveSelfVideo: false,

    options: {
      'appName': 'waartaa',
      'socketUrl': null,
      'reconnectTime': 10000 // in milliseconds
    },

    isConnected: function () {
      var id = Session.get('selfEasyrtcId');
      if (id)
        return true;
      else
        return false;
    },

    init: function (opt) {
      if (
          typeof easyrtc === 'undefined' ||
          this.isConnected()
         )
        return;

      $.extend(this.options, opt);
      options = this.options;
      Session.set('easyrtcStatus', 'connecting');
      Session.set('cameraEnabled', true);

      if (options.socketUrl)
        easyrtc.setSocketUrl(options.socketUrl);

      easyrtc.setUsername(Meteor.user().username);
      easyrtc.connect(options.appName, connectSuccessCB, connectErrorCB);
      easyrtc.setDisconnectListener(disconnectListener);
      easyrtc.setRoomOccupantListener(roomListener);
      easyrtc.setAcceptChecker(acceptChecker);
      easyrtc.setStreamAcceptor(streamAcceptor);
      easyrtc.setOnStreamClosed(onStreamClosed);
    },

    performCall: function (otherEasyrtcId) {
      var hangout = true;
      if (easyrtc.getConnectionCount() > 0) {
        var c = confirm('Current hangout will be closed. Do you want to continue?');
        hangout = c;
      }
      if (!hangout)
        return;

      easyrtc.hangupAll();
      Session.set('videoCallingId', otherEasyrtcId);

      var mediaSuccessCB = function () {
        easyrtc.call(otherEasyrtcId, successCB, errorCB, acceptedCB);
      };

      var mediaErrorCB = function (errCode, errText) {
        $('.errMsg').text(errText);
        $('.errMsg').show().delay(5000).fadeOut();
      };

      var enableCamera = Session.get('cameraEnabled') ? true : false;
      easyrtc.enableCamera(enableCamera);

      if (easyrtc.getLocalStream()) {
        mediaSuccessCB();
      } else {
        easyrtc.initMediaSource(mediaSuccessCB, mediaErrorCB);
      }
    },

    renderLocalStream: function () {
      var videoObj = document.getElementById('self-video');
      if(!videoObj || this.haveSelfVideo)
        return;
      var stream = easyrtc.getLocalStream();
      easyrtc.setVideoObjectSrc(videoObj, stream);
      if (stream) {
        this.haveSelfVideo = true;
        $('#self-video-container').show();
      } else {
        $('#self-video-container').hide();
      }
    },

    renderRemoteStream: function () {
      var videoObj = document.getElementById('remote-video');
      if(!videoObj)
        return;
      var stream = this.remoteStream;
      easyrtc.setVideoObjectSrc(videoObj, stream);
      if (stream) {
        $('#remote-video-container').show();
      } else {
        $('#remote-video-container').hide();
      }
    },

    resetLocalVideoObj: function () {
      if (typeof easyrtc === 'undefined')
        return;
      var videoObj = document.getElementById('self-video');
      easyrtc.setVideoObjectSrc(videoObj, '');
      this.haveSelfVideo = false;
    },

    resetRemoteVideoObj: function () {
      if (typeof easyrtc === 'undefined')
        return;
      var videoObj = document.getElementById('remote-video');
      easyrtc.setVideoObjectSrc(videoObj, '');
    },

    hangup: function (otherEasyrtcId) {
      easyrtc.hangup(otherEasyrtcId);
    },

    selfUsername: function () {
      var id = Session.get('selfEasyrtcId');
      if (id) {
        var username = easyrtc.idToName(id);
        return username;
      }
    },

    remoteUsername: function () {
      var id = Session.get('otherEasyrtcId');
      if (id) {
        var username = easyrtc.idToName(id);
        return username;
      }
    },

    disconnect: function () {
      easyrtc.disconnect();
    }
  };

  return self;
})();
