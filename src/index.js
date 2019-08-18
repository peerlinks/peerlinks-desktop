import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, compose, applyMiddleware } from 'redux';
import logger from 'redux-logger';
import thunk from 'redux-thunk';

import './index.css';
import App from './App';
import reducer from './redux/reducers';

const store = createStore(reducer, compose(applyMiddleware(thunk, logger)));

ReactDOM.render(<Provider store={store}>
  <App/>
</Provider>, document.getElementById('root'));
