import { createReducer } from '../utils';
import { LOGIN_USER_SUCCESS } from '../constants/actionTypes.jsx';
import { push } from 'react-router-redux';
import jwtDecode from 'jwt-decode';

const initialState = {
  token: null,
  userName: null,
  isAuthenticated: false,
  isAuthenticating: false,
  statusText: null
};

export default createReducer(initialState, {
  [LOGIN_USER_SUCCESS]: (state, payload) => {
    return Object.assign({}, state, {
      'isAuthenticating': false,
      'isAuthenticated': true,
      'token': payload.token,
      'userName': jwtDecode(payload.token).userName,
      'statusText': 'You have been successfully logged in.'
    });
  }
})
