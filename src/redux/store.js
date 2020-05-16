import { createHashHistory as createHistory } from 'history';
import { applyMiddleware, compose, createStore } from 'redux';
import { routerMiddleware } from 'connected-react-router';
import logger from 'redux-logger';
import thunk from 'redux-thunk';

import createRootReducer from './reducers';

export default () => {
  const history = createHistory();

  const store = createStore(
    createRootReducer(history),
    compose(applyMiddleware(routerMiddleware(history), thunk, logger)))

  return { store, history };
};
