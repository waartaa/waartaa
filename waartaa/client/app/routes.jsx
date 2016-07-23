import React from 'react';
import { Route, IndexRoute } from 'react-router';

import MaterialApp from './containers/App.jsx';
import RootPageContainer from './containers/app/RootPageContainer.jsx';
import Chat from './containers/Chat.jsx';

import CallbackPage from './components/CallbackPage.jsx';

export default (
  <Route>
    <Route path="/" component={MaterialApp}>
      <IndexRoute component={RootPageContainer}/>
    </Route>
    <Route path="/chat" component={Chat}>
      <Route path="/:channelName" component={Chat} />
    </Route>
    <Route path="/oidc_callback" component={CallbackPage} />
  </Route>
)
