import React from 'react';
import { render } from 'react-dom';
import { hashHistory, browserHistory, Router, Route, Link, Redirect } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux'

import Root from './containers/Root.jsx';
import configureStore from './stores/configureStore.jsx';
import {loginUserSuccess} from './actions/actions.jsx';

const { store, history } = configureStore(browserHistory, window.__INITIAL_STATE__);
const target = document.getElementById('app');

const node = (
  <Root store={store} history={history} />
);

let token = localStorage.getItem('token');
if (token !== null) {
  store.dispatch(loginUserSuccess(token));
}

render(node, target);
