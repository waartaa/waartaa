/**
* Allows you to register actions that when dispatched, send the action to the
* server via a socket.io socket.
* `option` may be an array of action types, a test function, or a string prefix.
*/
export default function createSockjsMiddleware(sock) {
  return ({ dispatch }) => {
    // Wire sockjs to dispatch actions sent by the server.
    sock.onmessage = (e) => {
      console.log('Message received');
      console.log(e.data);
      dispatch(JSON.parse(e.data));
    }

    return next => action => {
      const { remote } = action;

      if (remote) {
        sock.send(JSON.stringify(action));
      }

      return next(action);
    };
  };
}
