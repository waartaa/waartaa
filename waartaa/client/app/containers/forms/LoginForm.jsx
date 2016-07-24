import React, { Component, PropTypes } from 'react';
import { reduxForm } from 'redux-form';
import TextField from 'material-ui/TextField';
import Paper from 'material-ui/Paper'
import RaisedButton from 'material-ui/RaisedButton';

export const fields = [ 'username', 'password' ]

const style = {
  height: 300,
  width: 400,
  padding: 20,
  textAlign: "center"
}

class LoginForm extends Component {
  handleSubmit = (event) => {
    event.preventDefault();
    console.log('form submitted')
  };

  render() {
    const {
      fields: { username, password },
      submitting
      } = this.props
    return (
      <div>
        <Paper style={style} zDepth={1} rounded={false}>
          <form onSubmit={this.handleSubmit}>
            <TextField
              floatingLabelText="Username"
              floatingLabelFixed={false}
              fullWidth={true}
            />
            <br />
            <TextField
              floatingLabelText="Password"
              floatingLabelFixed={false}
              type="password"
              fullWidth={true}
            />
            <br />
            <RaisedButton label="Login" type="submit" primary={true} />
          </form>
        </Paper>
      </div>
    )
  }
}

LoginForm.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired
}

export default reduxForm({
  form: 'simple',
  fields
})(LoginForm);
