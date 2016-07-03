import React, { Component } from 'react';

import ChatMenu from './ChatMenu';
import ChatRoom from './ChatRoom';

class ChatApp extends Component {
  render() {
    return (
      <div>
        <ChatMenu {...this.props}/>
        <ChatRoom {...this.props}/>
      </div>
    )
  }
}

export default ChatApp;
