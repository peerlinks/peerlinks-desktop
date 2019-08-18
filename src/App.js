import React from 'react';
import { connect } from 'react-redux';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';

import './App.css';

import FullScreen from './layouts/FullScreen';
import ChannelLayout from './layouts/Channel';

import Channel from './pages/Channel';
import SignIn from './pages/SignIn';
import NewChannel from './pages/NewChannel';

import { initBackend } from './redux/actions';

function App({ backend, channels, initBackend }) {
  if (backend.error) {
    return <FullScreen>
      <p className='error'>Got error: {backend.error.stack}</p>
    </FullScreen>;
  }

  if (backend.ready) {
    const channelId = channels.size === 0 ? null :
      Array.from(channels.keys())[0];

    return <Router>
      <ChannelLayout>
        {channelId && <Redirect to={`/channel/${channelId}`}/>}
        <Route path='/new-channel' exact component={NewChannel}/>
        <Route path='/channel/:id' component={Channel}/>
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
    backend: state.loaders.backend,
    channels: state.channels,
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
