import React from 'react';
import ReactDOM from 'react-dom';
import { browserHistory, Router, Route, Link, Redirect } from 'react-router';
import App from './components/App.jsx';
import Note from './components/Note.jsx';

ReactDOM.render((
  <Router history={browserHistory}>
    <Route path="/" component={App} />
    <Route path="/home" component={Note} />
  </Router>
), document.getElementById('app'));
