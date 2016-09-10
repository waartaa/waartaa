import React, {Component, PropTypes} from 'react';
import {DocumentTitle} from 'react-document-title';

class LoginPage extends Component {
  getTitle() {
    return 'waartaa';
  }

  render() {
    return (
      <div class="{this.getTitle()}">
        <div className="col-md-6">
          <h3>Use an existing account</h3>
        </div>
        <div className="col-md-6">
          <h3>Create a Waartaa account</h3>
          <form id="create-account-form">
            <div className="form-group row"><input type="text" class="form-control" id="full-name" placeholder="Full Name" /></div>
            <div className="form-group row"><input type="text" class="form-control" id="email" placeholder="Email" /></div>
            <div className="form-group row"><input type="password" class="form-control" id="password" placeholder="Password" /></div>
            <div className="form-group row"><input type="password" class="form-control" id="password-repeat" placeholder="Password repeat" /></div>
            <div className="form-group row"><button type="submit" class="btn btn-primary">Create Account</button></div>
          </form>
        </div>
      </div>
    )
  }
}

export default LoginPage;
