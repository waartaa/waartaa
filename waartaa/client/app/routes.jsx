import React from 'react';
import { Route } from 'react-router';

import MaterialApp from './containers/App.jsx';
import Chat from './containers/Chat.jsx';

export default (
  <Route>
    <Route path="/" component={MaterialApp} />
    <Route path="/chat" component={Chat} />
  </Route>
)
