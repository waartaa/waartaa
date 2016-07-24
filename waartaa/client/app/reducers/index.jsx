import { combineReducers } from 'redux';
import { routerReducer as routing } from 'react-router-redux';
import { reducer as reduxReducer } from 'redux-oidc';
import { reducer as formReducer } from 'redux-form';

const rootReducer = combineReducers({
  oidc: reduxReducer,
  routing: routing,
  form: formReducer
});

export default rootReducer
