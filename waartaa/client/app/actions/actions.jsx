import { browserHistory } from 'react-router';
import { logout as logoutOidc } from 'redux-oidc';
import * as types from '../constants/actionTypes';
import { getRedirectPath, setRedirectPath } from '../helpers/oidcHelpers';

export function authenticationSuccess(profile) {
  browserHistory.push(getRedirectPath() || '/');
  setRedirectPath();
  return {
    type: types.AUTHENTICATION_SUCCESS,
    profile
  };
}

export function authenticationError(error) {
  toastr.error('Failed', 'Authentication Error');
  return {
    type: types.AUTHENTICATION_ERROR,
    error
  };
}

export function authorizationError(err, body) {
  toastr.error('Failed', 'Authorization Error');
  return {
    type: types.AUTHORIZATION_ERROR,
    error: {err, body}
  };
}

export function logout(error) {
  logoutOidc();
  browserHistory.push('/');
  return {
    type: types.AUTHORIZATION_ERROR,
    error
  }
}
