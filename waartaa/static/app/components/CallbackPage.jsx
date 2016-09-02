import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { CallbackComponent } from 'redux-oidc';

class CallbackPage extends React.Component {
  successCallback = () => {
    this.props.dispatch(push('/'));
  };

  render() {
    return (
      <CallbackComponent successCallback={this.successCallback.bind(this)}>
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
