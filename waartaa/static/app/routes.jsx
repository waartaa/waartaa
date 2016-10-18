import React from 'react';
import { Route, IndexRoute } from 'react-router';

import App from './components/App.jsx';
import LoginPage from './components/login/LoginPage.jsx';
import { requireAuthentication } from './utils';

export default (
  <Route path="/">
    <Route path="/login" component={LoginPage} />
    <Route path="/protected" component={requireAuthentication(App)} />
  </Route>
)
