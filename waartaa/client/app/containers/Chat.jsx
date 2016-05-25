import React, {Component} from 'react';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import {Card, CardHeader, CardText} from 'material-ui/Card';
import TextField from 'material-ui/TextField';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import IconButton from 'material-ui/IconButton';
import ContentSend from 'material-ui/svg-icons/content/send';
import SocialPerson from 'material-ui/svg-icons/social/person';
import Avatar from 'material-ui/Avatar';

export default class Chat extends Component {

  render() {
    return (
      <MuiThemeProvider muiTheme={getMuiTheme()}>
				<ChatApp />
      </MuiThemeProvider>
    );
  }
}

const ChatApp = () => (
	<div>
		<ChatMenu />
		<ChatRoom />
	</div>
)

const ChatMenu = () => (
  <Drawer open={true} zDepth={1}>
    <List>
      <ListItem key={1} className="network" primaryText="Freenode" />
      <ListItem key={2} className="channel" primaryText="#waartaa" />
      <ListItem key={3} className="channel" primaryText="#fedora" />

      <Divider />

      <ListItem key={4} className="network" primaryText="GIMPNet" />
      <ListItem key={5} className="channel" primaryText="#gnome" />
      <ListItem key={6} className="channel" primaryText="#gnome-love" />

    </List>
  </Drawer>

)

class ChatRoom extends Component {
  render() {
    let l = [],
        i = 1;
    for (i; i<= 100; i++) {
      l.push(i);
    }
    let chatLogNodes = l.map(function(item) {
      return (
        <div>
          <ListItem
            leftAvatar={<Avatar icon={<SocialPerson />} />}
            key={item}
            primaryText={"user" + item}
            secondaryText={
              <p>
                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,
              </p>
            }
          />
          <Divider />
        </div>
      );
    });
    let chatUserNodes = l.map(function(item) {
      return (
        <ListItem
          key={item}
          primaryText={"user" + item}
          leftAvatar={<Avatar icon={<SocialPerson />} />}
        />
      );
    });
    return (
      <div style={styles.chatRoom}>
        <AppBar title="#waartaa" />
        <div>
          <div>
            <div style={styles.chatLogsContainer}>
              <List>
                {chatLogNodes}
              </List>
            </div>
            <Drawer containerStyle={styles.chatRoomUsers} open={true} zDepth={1} openSecondary={true}>
              <TextField
                fullWidth={true}
                hintText="Filter users..."
              />
              <List>
                {chatUserNodes}
              </List>
            </Drawer>
          </div>
          <div  style={styles.chatInput}>
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
}

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
