import React, {Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { CallbackComponent } from 'redux-oidc';
import { bindActionCreators } from 'redux';
import { push } from 'react-router-redux';

import * as actions from '../actions/actions';
import {createTokenManager, createTokenManagerConfig} from '../helpers/oidcHelpers';

class CallbackPage extends Component {
  successCallback = () => {
    this.props.dispatch(push('/'))
  };

  // pass in custom content to render in the CallbackComponent
  get customContent() {
    return (
      <div>Redirecting...</div>
    );
  }

  render() {
    return (
      <CallbackComponent
        successCallback={this.successCallback.bind(this)}
      >
        { this.customContent }
      </CallbackComponent>
    );
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch)
  };
}

export default connect(null, mapDispatchToProps)(CallbackPage);
