import * as types from '../constants/actionTypes';

const initialState = {
  user: null
}

var authed = (state = initialState, action) => {
  switch (action.type) {
    case types.LOGGEDIN:
      return Object.assign({}, state, {
        user: action.data.user
      });
    default:
      return state
  }
}

export default authed;
