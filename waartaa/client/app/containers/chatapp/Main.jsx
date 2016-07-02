import React, { Component } from 'react';

import withWidth, {MEDIUM, LARGE} from 'material-ui/utils/withWidth';

import ChatMenu from './ChatMenu';
import ChatRoom from './ChatRoom';

class ChatApp extends Component {
  render() {
    return (
      <div>
        <ChatMenu />
        <ChatRoom />
      </div>
    )
  }
}

export default withWidth()(ChatApp)
