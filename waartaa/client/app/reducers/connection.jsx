import * as types from '../constants/actionTypes';

const initialState = {
  connected: false
}

var connection = (state = initialState, action) => {
  switch (action.type) {
    case types.CONNECTED:
      return Object.assign({}, state, {
        connected: true
      });
    default:
      return state
  }
}

export default connection;
