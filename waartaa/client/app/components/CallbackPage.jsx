import React from 'react';
import { connect } from 'react-redux';
import { CallbackComponent } from 'redux-oidc';

class CallbackPage extends React.Component {
  successCallback = (user) => {
     // the url before redirection was triggered is passed into the user object
     // and can be accessed like this
     redirect(user.state.redirectUrl);
  };

  render() {
    return (
      <CallbackComponent successCallback={this.successCallback}>
        My custom content!
      </CallbackComponent>
    )
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch
  };
}

export default connect(null, mapDispatchToProps)(CallbackPage);
