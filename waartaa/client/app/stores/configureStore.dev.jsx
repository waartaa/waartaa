import { createStore } from 'redux';
import rootReducer from '../reducers';

function configureStore(initialState) {
  const store = createStore(
    rootReducer,
    initialState
  )

  return store;
}

export default configureStore;
