import React, {Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { CallbackComponent } from 'redux-oidc';
import { bindActionCreators } from 'redux';

import * as actions from '../actions/actions';
import {createTokenManager, createTokenManagerConfig} from '../helpers/oidcHelpers';

class CallbackPage extends Component {
//   static propTypes: {
//     actions: PropTypes.shape({
//       authenticationError  : PropTypes.func.isRequired,
//       authenticationSuccess: PropTypes.func.isRequired
//     }).isRequired,
//   }

  // this method gets called when the token validation fails
  onTokenValidationError = (error) => {
    this.props.actions.authenticationError(error);
  };

  successCallback = () => {
    this.props.actions.authenticationSuccess(createTokenManager().profile);
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
        redirectOnSuccess={false}
        config={createTokenManagerConfig()}
        successCallback={this.successCallback}
        errorCallback={this.onTokenValidationError}
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
