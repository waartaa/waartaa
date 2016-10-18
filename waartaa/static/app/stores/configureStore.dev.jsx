import { createStore, applyMiddleware, compose } from 'redux';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk'; 

import rootReducer from '../reducers';
import SockJS from 'sockjs-client';
import createSockjsMiddleware from '../middlewares/sockjs';
import * as types from '../constants/actionTypes';

var sock = new SockJS('/sockjs');
var sockjsMiddleware = createSockjsMiddleware(sock);

sock.onmessage = function(e) {
  console.log('Received message')
  console.log(e.data)
  let resp = JSON.parse(e.data)
  if (resp.type === "loggedin") {
    sock.send(
      JSON.stringify({
        type: 'subscribe_networks',
        data: {}
      })
    );
  } else if (resp.type === "networks_fetched") {
    let i
    for (i = 0; i < resp.data.length; i++) {
      let action = {
        type: 'subscribe_channels',
        data: {
          'network_id': resp.data[i].id
        }
      }
      sock.send(JSON.stringify(action))
    }
  }
}

export default function configureStore(baseHistory, initialState) {
	const routingMiddleware = routerMiddleware(baseHistory);
	const logger = createLogger();
	const middleware = applyMiddleware(routingMiddleware, thunk, logger);

  const store = createStore(
    rootReducer,
    initialState,
	middleware
  )
  const history = syncHistoryWithStore(baseHistory, store)

  if (module.hot) {
    module.hot
    .accept('../reducers', () => {
      const nextRootReducer = require('../reducers/index');
      store.replaceReducer(nextRootReducer);
    });
  }

  return { store, history };
}
