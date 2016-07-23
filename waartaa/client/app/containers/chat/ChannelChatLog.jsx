import React, {Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import TextField from 'material-ui/TextField';
import withWidth, {MEDIUM, LARGE} from 'material-ui/utils/withWidth';

import Messages from '../../components/chat/Messages.jsx';
import { fetchMessages } from '../../actions/actions.jsx';

const propTypes = {
  dispatch: PropTypes.func.isRequired,
  messages: PropTypes.object.isRequired,
  current_user: PropTypes.object.isRequired,
}

class ChannelChatLog extends Component {
  componentWillMount = () => {
    const { dispatch, meesages, current_user } = this.props;
    dispatch(fetchMessages());
  }

  render = () => {
    return (
      <div>
        <Messages {...this.props}/>
      </div>
    )
  }
}

function mapStateToProps(state) {
  const { messages, current_user, channel } = state;

  return {
    messages,
    current_user,
    channel,
  }
}

export default connect(mapStateToProps)(ChannelChatLog);
