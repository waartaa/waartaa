import { browserHistory } from 'react-router';
import { logout as logoutOidc } from 'redux-oidc';
import * as types from '../constants/actionTypes.jsx';

export function loginUserSucess(token) {
  localStorage.setItem('token', token);
  return {
    type: LOGIN_USER_SUCCESS,
    payload: {
      token: token
    }
  }
}
