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


var ChatRoom = React.createClass({
  getInitialState: function() {
      return {
          title: "Waartaa"
      }
  },

  getDefaultProps: function() {
      return {
          logItems: []
      }
  },

  componentWillMount: function() {
      // Setting list of user before mounting the component
      for (var i=0; i<=100; i++) {
          this.props.logItems.push(i);
      }
  },

  _renderChatLogNodes: function() {
      return this.props.logItems.map(function(item, index) {
          return <div key={index}>
            <ListItem
              leftAvatar={<Avatar icon={<SocialPerson />} />}
              primaryText={"user" + item}
              secondaryText={
                    <p>
                      Lorem is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s,
                    </p>
              }/>
                <Divider />
          </div>
      })
  },

  _renderChatLogContainer: function() {
      return <div>
          <div style={styles.chatLogsContainer}>
            <List>
              {this._renderChatLogNodes()}
            </List>
          </div>
        </div>
  },

  _renderChatUserNode: function() {
    return this.props.logItems.map(function(item, index){
      return <ListItem
        key={index}
        primaryText={"user" + item}
        leftAvatar={<Avatar icon={<SocialPerson />} />}
      />
    });
  },

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
      </div>
    );
  }
});

module.exports = ChatRoom;
