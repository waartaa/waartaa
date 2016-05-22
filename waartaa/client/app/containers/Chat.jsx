import React, {Component} from 'react';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import {Card, CardHeader, CardText} from 'material-ui/Card';
import TextField from 'material-ui/TextField';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';

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
	<Drawer open={true} zDepth={1} />
)

const ChatRoom = () => (
	<div style={styles.chatRoom}>
		<AppBar />
		<div>
			<div  style={styles.chatInput}>
				<TextField />
			</div>
			<Drawer containerStyle={styles.chatRoomUsers} open={true} zDepth={1} openSecondary={true} />
		</div>
	</div>
)

const styles = {
	chatRoom: {
		paddingLeft: 256
	},
	chatLogsContainer: {
		width: '80%',
		height: '100%',
		bottom: -50
	},
	chatRoomUsers: {
		marginTop: 80,
		marginBottom: 200
	},
	chatInput: {
		position: 'absolute',
		bottom: 4
	}
}
