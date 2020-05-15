import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';

import './index.css';
import App from './App';
import createStore from './redux/store';

const { store, history } = createStore();

ReactDOM.render(<Provider store={store}>
  <ConnectedRouter history={history}>
    <App/>
  </ConnectedRouter>
</Provider>, document.getElementById('root'));
