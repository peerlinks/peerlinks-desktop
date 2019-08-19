import React from 'react';
import { connect } from 'react-redux';
import { HashRouter as Router, Route } from 'react-router-dom';

import './App.css';

import { initNetwork, setRedirect } from './redux/actions';

import FullScreen from './layouts/FullScreen';
import ChannelLayout from './layouts/Channel';

import Channel from './pages/Channel';
import SignIn from './pages/SignIn';
import NewChannel from './pages/NewChannel';

import Redirect from './components/Redirect';

function App({ channels, network, initNetwork, setRedirect }) {
  if (network.isReady) {
    return <Router>
      <ChannelLayout>
        <Redirect/>
        <Route path='/new-channel' exact component={NewChannel}/>
        <Route path='/channel/:id/' component={Channel}/>
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
    initNetwork: (...args) => dispatch(initNetwork(...args)),
    setRedirect: (...args) => dispatch(setRedirect(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
