import React, {Component, PropTypes } from 'react';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import baseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';

export default class App extends Component {
    constructor(props, context) {
        super(props, context);
        this.state = {open: true}
    }

    getChildContext() {
        return {muiTheme: getMuiTheme(baseTheme)};
    }

    render() {
        return (
            <div>
                <Drawer open={this.state.open}>
                  <MenuItem>Menu Item</MenuItem>
                  <MenuItem>Menu Item 2</MenuItem>
                </Drawer>
            </div>
        );
    }
}

App.childContextTypes = {
      muiTheme: PropTypes.object.isRequired,
};

const MaterialApp = () => (
    <MuiThemeProvider muiTheme={getMuiTheme()}>
        <App />
    </MuiThemeProvider>
);

