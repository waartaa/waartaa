import { browserHistory } from 'react-router';
import { logout as logoutOidc } from 'redux-oidc';
import * as types from '../constants/actionTypes';
import { getRedirectPath, setRedirectPath } from '../helpers/oidcHelpers';

export function fetchMessages(channel, user) {
  return {
    type: constants.FETCHMESSAGES,
    channel,
    user
  }
}
