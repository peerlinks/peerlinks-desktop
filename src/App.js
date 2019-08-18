import React, { useState } from 'react';
import { connect } from 'react-redux';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';

import './App.css';

import network from './network';
import { addChannel, addIdentity } from './redux/actions';

import FullScreen from './layouts/FullScreen';
import ChannelLayout from './layouts/Channel';

import Channel from './pages/Channel';
import SignIn from './pages/SignIn';
import NewChannel from './pages/NewChannel';

function App({ backend, channels, addChannel, addIdentity }) {
  const [ ready, setReady ] = useState(false);
  const [ loading, setLoading ] = useState(false);
  const [ error, setError ] = useState(null);

  if (error) {
    return <FullScreen>
      <p className='error'>Got error: {error.stack}</p>
    </FullScreen>;
  }

  if (ready) {
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

  const init = async (passphrase) => {
    await network.init({ passphrase });

    const channels = await network.getChannels();
    for (const channel of channels) {
      addChannel(channel);
    }

    const identities = await network.getIdentities();
    for (const identity of identities) {
      addIdentity(identity);
    }
  };

  const onPassphrase = (passphrase) => {
    setLoading(true);
    init(passphrase).then(() => {
      setReady(true);
    }).catch((error) => {
      setError(error);
    }).finally(() => {
      setLoading(false);
    });
  };

  return <FullScreen>
    <SignIn isLoading={loading} onPassphrase={onPassphrase}/>
  </FullScreen>;
}

const mapStateToProps = (state) => {
  return {
    channels: state.channels,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addChannel: (channel) => dispatch(addChannel(channel)),
    addIdentity: (identity) => dispatch(addIdentity(identity)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
