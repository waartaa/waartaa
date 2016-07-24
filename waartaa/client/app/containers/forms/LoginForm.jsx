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


const submit = (values, dispatch) => {
  console.log(values);
  dispatch({
    type: 'login',
    data: values,
    remote: true
  });
};

class LoginForm extends Component {
  render() {
    const {
      fields: { username, password },
      handleSubmit,
      submitting
      } = this.props
    return (
      <div>
        <Paper style={style} zDepth={1} rounded={false}>
          <form onSubmit={handleSubmit(submit)}>
            <TextField
              floatingLabelText="Username"
              floatingLabelFixed={false}
              fullWidth={true}
              {...username}
            />
            <br />
            <TextField
              floatingLabelText="Password"
              floatingLabelFixed={false}
              type="password"
              fullWidth={true}
              {...password}
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

LoginForm = reduxForm({
  form: 'simple',
  fields
})(LoginForm);

export default LoginForm;
