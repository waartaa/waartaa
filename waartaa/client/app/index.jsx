import React from 'react';
import ReactDOM from 'react-dom';
import { browserHistory, Router, Route, Link, Redirect } from 'react-router';
import MaterialApp from './containers/App.jsx';

ReactDOM.render((
  <Router history={browserHistory}>
    <Route path="/" component={MaterialApp} />
  </Router>
), document.getElementById('app'));
