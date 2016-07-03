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
        'top': '56px',
      }
    };

    return styles;
  }

  render = () => {
    const styles = this.getStyles();

    if (this.props.width === LARGE) {
      this.state.secondaryDrawerOpen = true;
    } else {
      this.state.secondaryDrawerOpen = false;
    }

    return (
      <ChannelChatLogContainer {...this.props}/>
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
    )
  }
}

export default ChannelChatContainer;
