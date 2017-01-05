import React, {Component, PropTypes} from 'react';
import {DocumentTitle} from 'react-document-title';

import { loginUser } from '../../actions/actions.jsx';

class LoginPage extends Component {
  constructor(props) {
    super(props);
    this.login = this.login.bind(this);
  }

  getTitle() {
    return 'waartaa';
  }

  login(e) {
    const { dispatch } = this.props;
    dispatch(loginUser);
  }

  render() {
    return (
      <div>
        <div className="masthead">
          <div className="container">
            <div className="col-sm-3">
              <h1>{this.getTitle()}</h1>
            </div>
          </div>
        </div>
        <div className="bodycontent m-h-75">
          <div className="p-t-2">
            <div className="container">
              <div className="row">
                <h2 className="text-xs-center p-t-2 p-b-3">Start using waartaa today.</h2>
                <div className="col-md-6 m-x-auto text-xs-center">
                  <h4 className="p-b-3">Use an existing account</h4>
                  <button type="button" className="btn btn-outline-primary">Primary</button>
                </div>
                <div className="col-md-6 m-x-auto text-xs-center left-border">
                  <h4 className="p-b-3">Create a Waartaa account</h4>
                  <div className="col-md-10 col-md-offset-1">
                    <form id="create-account-form">
                      <div className="form-group row"><input type="text" className="form-control" id="full-name" placeholder="Full Name" /></div>
                      <div className="form-group row"><input type="text" className="form-control" id="email" placeholder="Email" /></div>
                      <div className="form-group row"><input type="password" className="form-control" id="password" placeholder="Password" /></div>
                      <div className="form-group row"><input type="password" className="form-control" id="password-repeat" placeholder="Password repeat" /></div>
                      <div className="form-group row">
                        <button type="submit" className="btn btn-primary" onClick={this.login}>Create Account</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default LoginPage;
