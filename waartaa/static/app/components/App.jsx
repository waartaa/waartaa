import React, {Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { CallbackComponent } from 'react-oidc';
import { push } from 'react-router-redux';


class CallbackPage extends Component {
  successCallback = () => {
    this.props.dispatch(push('/'));
  }
  
  render() {
    return (
      <CallbackComponent successCallback={this.successCallback.bind(this)} />
    );
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch
  };
}

export default connect(null, mapDispatchToProps)(CallbackPage);
