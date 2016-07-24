import { combineReducers } from 'redux';
import { routerReducer as routing } from 'react-router-redux';
import { reducer as reduxReducer } from 'redux-oidc';
import { reducer as formReducer } from 'redux-form';
import authed from './authed';
import connection from './connection';

const rootReducer = combineReducers({
  oidc: reduxReducer,
  routing: routing,
  form: formReducer,
  authed: authed
});

export default rootReducer
