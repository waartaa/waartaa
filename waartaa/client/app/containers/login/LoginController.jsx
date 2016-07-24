import React, {Component, PropTypes} from 'react';

import ActionAndroid from 'material-ui/svg-icons/action/android';
import RaisedButton from 'material-ui/RaisedButton';

import userManager from '../../helpers/oidcHelpers.jsx';
import LoginForm from '../forms/LoginForm';

export default class LoginController extends Component {
  onFASLoginButtonClick = (event) => {
    event.preventDefault();
    userManager.signinRedirect();
  };

  handleSubmit = (event) => {
    debugger;
    event.preventDefault();
    console.log('form submitted')
  };

  render() {
    return (
      <div>
        <RaisedButton
          label="Login with FAS"
          icon={<ActionAndroid/>}
          onMouseUp={this.onFASLoginButtonClick}
        />
        <LoginForm handleSubmit={this.handleSubmit} submitting={false} />
      </div>
    );
  }
}
