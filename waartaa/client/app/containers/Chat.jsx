import React from 'react';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import ChatApp from './chatapp/Main';


var Chat = React.createClass({
  render: function() {
    return  <MuiThemeProvider muiTheme={getMuiTheme()}>
                <ChatApp />
        </MuiThemeProvider>;
  }
});

module.exports = Chat;