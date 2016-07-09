import React, {Component} from 'react';

import {List, ListItem} from 'material-ui/List';
import Drawer from 'material-ui/Drawer';
import Subheader from 'material-ui/Subheader';
import withWidth, {MEDIUM, LARGE} from 'material-ui/utils/withWidth';

class ChannelChatLogContainer extends Component {
  constructor(props, context){
    super(props, context);
  }

  render = () => {
    return (
      <div>
        Hello! I am the Future Chat Container
      </div>
    )
  }
}

export default ChannelChatLogContainer;
