import React, { Component, PropTypes } from 'react';
import { Provider } from 'react-redux';
import { OidcProvider} from 'redux-oidc';
import { Router } from 'react-router';

import routes from '../routes';
import DevTools from './DevTools.jsx';
import userManager from '../helpers/oidcHelpers.jsx';

export default class Root extends Component {
  render() {
    const { store, history } = this.props;
    return (
      <Provider store={store}>
        <div>
          <OidcProvider store={store} userManager={userManager}>
            <Router history={history} routes={routes} />
          </OidcProvider>
          <DevTools />
        </div>
      </Provider>
    )
  }
}

Root.PropTypes = {
  store: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
}
