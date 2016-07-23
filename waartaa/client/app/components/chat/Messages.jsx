import React, { Component, PropTypes } from 'react';

const propTypes = {
  dispatch: PropTypes.func.isRequired,
  messages: PropTypes.object.isRequired,
  current_user: PropTypes.object.isRequired,
};

class Messages extends Component {
  constructor(props) {
    super(props);
  }

  renderMessages = (dispatch, messages, current_user) => {
    messages.map((message, index, current_user) => {
      return <Message
                dispatch={dispatch}
                message={message}
                current_user={current_user}
             />
    })
  }

  render = () => {
    const { messages, current_user } = this.props;

    return (
      <div className="messages-box">
        {this.renderMessages(dispatch, messages, current_user)}
      </div>
    )

  }
}

Messages.propTypes = PropTypes;

export default Messages;
