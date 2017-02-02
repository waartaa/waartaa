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
    event.preventDefault();
    console.log('form submitted')
  };

  render() {
    return (
      <div>
        <LoginForm handleSubmit={this.handleSubmit} submitting={false} />
      </div>
    );
  }
}
