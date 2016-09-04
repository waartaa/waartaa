import React from 'react';
import { render } from 'react-dom';
import { hashHistory, browserHistory, Router, Route, Link, Redirect } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux'

import Root from './containers/Root.jsx';
import configureStore from './stores/configureStore.jsx';

const store = configureStore();
const history = syncHistoryWithStore(browserHistory, store);

render(
  <Root store={store} history={history} />,
  document.getElementById('app')
);
