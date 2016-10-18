import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { reducer as reduxReducer } from 'redux-oidc';

import auth from './auth';

const rootReducer = combineReducers({
  auth,
  routing: routerReducer
});

export default rootReducer
