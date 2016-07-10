import React from 'react';

import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import withWidth from 'material-ui/utils/withWidth';

import ChatApp from './chat/ChatApp.jsx';

class Chat extends React.Component {
  render() {
    return (
      <MuiThemeProvider muiTheme={getMuiTheme()}>
        <ChatApp {...this.props} />
      </MuiThemeProvider>
    )
  }
}

export default withWidth()(Chat);
