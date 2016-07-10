import React, {Component, PropTypes} from 'react';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import baseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';

import DrawerFooter from '../components/Footer.jsx';

import container from '../stylesheets/base/common.less';

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
            <DrawerFooter/>
          </Drawer>
          <div className="container">
            {this.props.children}
          </div>
        </div>
      );
    }
}

App.childContextTypes = {
      muiTheme: PropTypes.object.isRequired,
};

const MaterialApp = () => (
    <MuiThemeProvider muiTheme={getMuiTheme()}>
        <App/>
    </MuiThemeProvider>
);
