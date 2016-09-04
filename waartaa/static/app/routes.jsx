import React from 'react';
import { Route, IndexRoute } from 'react-router';

import App from './components/App.jsx';
import LoginPage from './components/login/LoginPage.jsx';

export default (
  <Route path="/" component="App">
    <Route path="/login" component="LoginPage" />
  </Route>
)
