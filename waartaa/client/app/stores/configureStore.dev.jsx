import { createStore, compose } from 'redux';
import rootReducer from '../reducers';
import { applyMiddleware } from 'redux';
import oidcMiddleware from '../middleware/middleware.jsx';
import DevTools from '../containers/DevTools.jsx';

export default function configureStore(initialState) {
  const store = createStore(
    rootReducer,
    initialState,
    compose(
      applyMiddleware(oidcMiddleware),
      DevTools.instrument()
    )
  )

  return store;
}
