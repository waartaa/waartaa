import { browserHistory } from 'react-router';
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

export function loginUserFailure(token) {
  localStorage.removeItem('token');
  return {
    type: LOGIN_USER_FAILURE,
    payload: {
      status: error.response.status,
      statusText: error.response.statusText
    }
  }
}

export function loginUserRequest() {
  return {
    type: LOGIN_USER_REQUEST
  }
}

export function loginUser(email, password, redirect='/') {
  return function(dispatch) {
    dispatch(loginUserRequest());
    debugger;
    return fetch('http://localhost:3000/auth/getToken/', {
      method: 'post',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
      .then(response => {
        try {
          let decoded = jwtDecode(response.token);
          dispatch(loginUserSucess(response.token));
          dispatch(push(redirect));
        } catch(e) {
          dispatch(loginUserFailure({
            response: {
              status: 403,
              statusText: 'Invalid Token'
            }
          }));
        }
      })
      .catch(error => {
        dispatch(loginUserFailure(error));
      })
    })
  }
}
