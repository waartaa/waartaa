import React, { Component, PropTypes } from 'react';

const propTypes = {
  dispatch: PropTypes.func.isRequired,
  message: PropTypes.object.isRequired,
  current_user: PropTypes.bool.isRequired,
};

class Message extends Component {
  constructor = (props) => {
    super(props);
  }

  getStyles = () => {
    const styles = {
      floatRight: {
        float: 'right'
      },
      floatLeft: {
        float: 'left',
      },
      messageElContainer: {
        padding: 5,
      },
      clear: {
        clear: 'both',
      }
    }
    return styles;
  }

  render = () => {
    const { dispatch, message, current_user } = this.props;
    const { content, userid, username } = message;
    const styles = this.getStyles();

    currUser = current_user.userid == userid

    if (currUser) {
      var align = styles.floatRight;
    } else {
      var align = styles.floatLeft;
    }

    var avatarName = username.charAt(0).toUpperCase()
    return (
      <div className={styles.messageElContainer}>
          <div className={align}>
            <Avatar>{avatarName}</Avatar>
          </div>
          <div className={align}>
            <Paper
              zDepth={1}
              style={styles.message}
            >{content}</Paper>
          </div>
          <div className={styles.clear}></div>
      </div>
    )
  }
}

Message.propTypes = PropTypes;

export default Message;
