import React from 'react';

import Title from 'react-title-component';
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import AppBar from 'material-ui/AppBar';
import Avatar from 'material-ui/Avatar';
import SocialPerson from 'material-ui/svg-icons/social/person';
import TextField from 'material-ui/TextField';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import IconButton from 'material-ui/IconButton';
import ContentSend from 'material-ui/svg-icons/content/send';
import withWidth, {MEDIUM, LARGE} from 'material-ui/utils/withWidth';

import ChannelChatContainer from './ChannelChatContainer.jsx';

var ChatRoom = React.createClass({
  getStyles: function() {
    const styles = {
      appBar: {
        position: 'fixed',
        top: 0,
      },
    };
    return styles;
  },

  render: function() {
    const styles = this.getStyles();
    return (
      <div>
        <Title render="Waartaa" />
        <AppBar
          onLeftIconButtonTouchTap={this.handleonLeftIconButtonTouchTap}
          title={this.props.appBarTitle}
          zDepth={0}
          styles={styles.appBar}
          iconElementRight={
            <IconButton
              iconClassName="muidocs-icon-custom-github"
              href="https://github.com/callemall/material-ui"
            />
          }
        />
        <ChannelChatContainer {...this.props}/>
      </div>
    );
  }
});

module.exports = ChatRoom;
