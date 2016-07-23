import { combineReducers } from 'redux';
import { routerReducer as routing } from 'react-router-redux';
import { reducer as reduxReducer } from 'redux-oidc';

const rootReducer = combineReducers({
  oidc: reduxReducer,
  routing: routing
});

export default rootReducer
