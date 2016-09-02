import React, {Component} from 'react';

import TextField from 'material-ui/TextField';
import Divider from 'material-ui/Divider';
import withWidth, {MEDIUM, LARGE} from 'material-ui/utils/withWidth';

import ChannelChatLog from './ChannelChatLog.jsx';

class ChannelChatLogContainer extends Component {
  constructor(props, context){
    super(props, context);
  }

  getStyles = () => {
    const styles = {
      textField: {
        paddingLeft: 20,
        paddingRight: 20,
        boxSizing: 'border-box',
      }
    }

    return styles;
  }

  render = () => {
    const styles = this.getStyles();

    return (
      <div>
        <ChannelChatLog />
        <Divider />
        <TextField
          fullWidth={true}
          style={styles.textField}
        />
      </div>
    )
  }
}

export default ChannelChatLogContainer;
