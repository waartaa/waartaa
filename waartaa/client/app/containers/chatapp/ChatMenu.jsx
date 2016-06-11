import React from 'react';
import Drawer from 'material-ui/Drawer';
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';


var ChatMenu = React.createClass({
    render: function() {
        return <Drawer open={true} zDepth={1}>
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
    }
});

module.exports = ChatMenu;