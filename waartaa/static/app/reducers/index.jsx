import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { reducer as reduxReducer } from 'redux-oidc';
import { reducer as formReducer } from 'redux-form';
import authed from './authed';
import connection from './connection';

import auth from './auth';

const rootReducer = combineReducers({
  auth,
  routing: routerReducer
});

export default rootReducer
