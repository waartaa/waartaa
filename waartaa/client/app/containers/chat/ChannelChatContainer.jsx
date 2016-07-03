import React, {Component} from 'react';

import {List, ListItem} from 'material-ui/List';
import Drawer from 'material-ui/Drawer';
import Subheader from 'material-ui/Subheader';
import withWidth, {MEDIUM, LARGE} from 'material-ui/utils/withWidth';


class ChannelChatContainer extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {secondaryDrawerOpen: false}
  }

  render () {
    if (this.props.width === LARGE) {
      this.state.secondaryDrawerOpen = true;
    } else {
      this.state.secondaryDrawerOpen = false;
    }

    return (
      <Drawer
        openSecondary={true}
        open={this.state.secondaryDrawerOpen}
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
