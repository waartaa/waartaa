import { createStore, applyMiddleware, compose } from 'redux';
import rootReducer from '../reducers';
import oidcMiddleware from '../middleware/middleware.jsx';
import DevTools from '../containers/DevTools.jsx';
import SockJS from 'sockjs-client';
import createSockjsMiddleware from '../middlewares/sockjs';

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

export default function configureStore(initialState) {
  const store = createStore(
    rootReducer,
    initialState,
    compose(
      applyMiddleware(sockjsMiddleware),
      applyMiddleware(oidcMiddleware),
      DevTools.instrument()
    )
  )

  sock.onopen = () => {
    store.dispatch({
      type: 'login',
      data: {
        username: 'rtnpro',
        password: 'password'
      },
      remote: true
    })
  }

  return store;
}
