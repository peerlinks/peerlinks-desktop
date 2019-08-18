import React from 'react';
import { connect } from 'react-redux';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import './App.css';

import FullScreen from './layouts/FullScreen';
import ChannelLayout from './layouts/Channel';

import Channel from './pages/Channel';
import SignIn from './pages/SignIn';
import NewChannel from './pages/NewChannel';

import { initBackend } from './redux/actions';

function App({ backend, initBackend }) {
  if (backend.error) {
    return <FullScreen>
      <h2>Got error: {backend.error}</h2>
    </FullScreen>;
  }

  if (backend.ready) {
    return <Router>
      <ChannelLayout>
        <Route path='/new-channel' exact component={NewChannel}/>
        <Route path='/channel' component={Channel}/>
      </ChannelLayout>
    </Router>;
  }

  const onPassphrase = (passphrase) => {
    initBackend({ passphrase });
  };

  return <FullScreen>
    <SignIn isLoading={backend.loading} onPassphrase={onPassphrase}/>
  </FullScreen>;
}

const mapStateToProps = (state) => {
  return {
    backend: state.backend,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    initBackend({ passphrase }) {
      dispatch(initBackend({ passphrase }));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
