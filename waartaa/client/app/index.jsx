import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { browserHistory, Router, Route, Link, Redirect } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux'

import Root from './containers/Root'
import configureStore from './stores/configureStore'

const store = configureStore()
const history = syncHistoryWithStore(browserHistory, store)

ReactDOM.render(
  <Root store={store} history={history} />,
  document.getElementById('app')
);
