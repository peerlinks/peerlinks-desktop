import React from 'react';
import { connect } from 'react-redux';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';

import './App.css';

import { initNetwork } from './redux/actions';

import FullScreen from './layouts/FullScreen';
import ChannelLayout from './layouts/Channel';

import Channel from './pages/Channel';
import SignIn from './pages/SignIn';
import NewChannel from './pages/NewChannel';

function App({ channels, network, initNetwork }) {
  if (network.error) {
    return <FullScreen>
      <p className='error'>Got error: {network.error.stack}</p>
    </FullScreen>;
  }

  if (network.isReady) {
    // Select first channel if any are available
    let redirect;
    if (channels.size === 0) {
      redirect = '/new-channel';
    } else {
      const channelId = Array.from(channels.keys())[0];
      redirect = `/channel/${channelId}`;
    }

    return <Router>
      <ChannelLayout>
        <Route exact path="/" render={() => {
          return <Redirect to={redirect}/>;
        }}/>

        <Route path='/new-channel' exact component={NewChannel}/>
        <Route path='/channel/:id' component={Channel}/>
      </ChannelLayout>
    </Router>;
  }

  const onPassphrase = (passphrase) => {
    initNetwork({ passphrase });
  };

  return <FullScreen>
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
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
