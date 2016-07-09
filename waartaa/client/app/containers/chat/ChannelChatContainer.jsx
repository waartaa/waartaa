import React, {Component} from 'react';

import {List, ListItem} from 'material-ui/List';
import Drawer from 'material-ui/Drawer';
import Subheader from 'material-ui/Subheader';
import withWidth, {MEDIUM, LARGE} from 'material-ui/utils/withWidth';

import ChannelChatLogContainer from './ChannelChatLogContainer.jsx';

class ChannelChatContainer extends Component {
  constructor(props, context){
    super(props, context);
    this.state = {secondaryDrawerOpen: false}
  }

  getStyles = () => {
    const styles = {
      secondaryDrawer: {
        top: '56px',
      },
      chatContainer: {
        minHeight: 400,
        paddingLeft: 20,
      }
    };
    return styles;
  }

  render = () => {
    const muiTheme = this.props.muiTheme;

    const styles = this.getStyles();

    if (this.props.width === LARGE) {
      this.state.secondaryDrawerOpen = true;
      styles.chatContainer.paddingLeft = 280;
    } else {
      this.state.secondaryDrawerOpen = false;
    }

    return (
      <div>
        <div style={styles.chatContainer}>
          <ChannelChatLogContainer {...this.props} />
        </div>
        <Drawer
          width={200}
          openSecondary={true}
          open={this.state.secondaryDrawerOpen}
          containerStyle={styles.secondaryDrawer}
        >
          <List>
            <Subheader>Users</Subheader>
              <ListItem
                primaryText="Brendan Lim"
              />
              <ListItem
                primaryText="Harley Davidson"
              />
          </List>
        </Drawer>
      </div>
    )
  }
}

export default ChannelChatContainer;
