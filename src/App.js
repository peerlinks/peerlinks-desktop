import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { HashRouter as Router, Route } from 'react-router-dom';

import './App.css';

import { checkNetwork, initNetwork } from './redux/actions';

import FullScreen from './layouts/FullScreen';
import ChannelLayout from './layouts/Channel';

import Channel from './pages/Channel';
import SignIn from './pages/SignIn';
import NewChannel from './pages/NewChannel';
import DeleteChannel from './pages/DeleteChannel';

import Redirect from './components/Redirect';

function App({ channels, network, checkNetwork, initNetwork }) {
  // Check if the window as reopened and network is ready
  useEffect(() => {
    checkNetwork();
  }, []);

  if (network.isReady) {
    return <Router>
      <ChannelLayout>
        <Redirect/>
        <Route path='/new-channel' exact component={NewChannel}/>
        <Route path='/channel/:id/' exact component={Channel}/>
        <Route path='/channel/:id/delete' exact component={DeleteChannel}/>
      </ChannelLayout>
    </Router>;
  }

  const onPassphrase = (passphrase) => {
    initNetwork({ passphrase });
  };

  return <FullScreen>
    {network.error && <p className='error'>
      Got error: {network.error.message}
    </p>}
    <SignIn isLoading={network.isLoading} onPassphrase={onPassphrase}/>
  </FullScreen>;
}

const mapStateToProps = (state) => {
  return {
    network: state.network,
    channels: state.channels,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    checkNetwork: (...args) => dispatch(checkNetwork(...args)),
    initNetwork: (...args) => dispatch(initNetwork(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
