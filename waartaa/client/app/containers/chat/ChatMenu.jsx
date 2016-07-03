import React, { Component }from 'react';
import Drawer from 'material-ui/Drawer';
import {List, ListItem, MakeSelectable} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import { LARGE } from 'material-ui/utils/withWidth';

const SelectableList = MakeSelectable(List);

class ChatMenu extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {open: false}
  }

  handleListChangeRequest = (event, value) => {
    this.props.appBarTitle = value
  }

  render () {
    if (this.props.width === LARGE) {
      this.state.open = true;
    } else {
      this.state.open = false;
    }

    return (
      <Drawer open={this.state.open} zDepth={1}>
        <SelectableList
          onChange={this.handleListChangeRequest}
        >
          <ListItem
            className="network"
            primaryText="Freenode"
            primaryTogglesNestedList={true}
            nestedItems={[
              <ListItem
                className="channel"
                primaryText="#waartaa"
                value="freenode"
              />,
              <ListItem
                className="channel"
                primaryText="#fedora"
                value="freenode"
              />
            ]}
          />
          <Divider />
        </SelectableList>
      </Drawer>
    )
  }
}

export default ChatMenu;
