import React from 'react';
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import Avatar from 'material-ui/Avatar';
import SocialPerson from 'material-ui/svg-icons/social/person';
import TextField from 'material-ui/TextField';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import IconButton from 'material-ui/IconButton';
import ContentSend from 'material-ui/svg-icons/content/send';


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
            <Drawer containerStyle={styles.chatRoomUsers} open={true} zDepth={1} openSecondary={true}>
              <TextField
                fullWidth={true}
                hintText="Filter users..."/>
              <List>
                {this._renderChatUserNode()}
              </List>
            </Drawer>
          </div>
    },

    _renderChatUserNode: function() {
        return this.props.logItems.map(function(item, index){
            return <ListItem
                  key={index}
                  primaryText={"user" + item}
                  leftAvatar={<Avatar icon={<SocialPerson />} />} />
        });
    },

  render: function() {
    return (
      <div style={styles.chatRoom}>
        <AppBar title={this.state.title} />
        <div>
          {this._renderChatLogContainer()}
          <div style={styles.chatInput}>
            <Toolbar>
              <ToolbarGroup firstChild={true} style={{width: "70%"}}>
                <TextField fullWidth={true} hintText="Type your message..." />
                <IconButton>
                  <ContentSend />
                </IconButton>
              </ToolbarGroup>
            </Toolbar>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = ChatRoom;

const styles = {
    chatRoom: {
        paddingLeft: 256
    },
    chatLogsContainer: {
        position: 'fixed',
        left: 263,
        right: 261,
        top: 75,
        bottom: 63,
        overflowY: 'auto'
    },
    chatRoomUsers: {
        marginTop: 80,
        bottom: 62,
        height: 'inherit'
    },
    chatInput: {
        position: 'absolute',
        bottom: 4,
        width: '100%'
    }
}