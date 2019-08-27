import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { HashRouter as Router, Route } from 'react-router-dom';

import './App.css';

import { checkNetwork } from './redux/actions';

import FullScreen from './layouts/FullScreen';
import ChannelLayout from './layouts/Channel';

import Channel from './pages/Channel';
import SignIn from './pages/SignIn';
import NewChannel from './pages/NewChannel';
import NewFeed from './pages/NewFeed';
import InviteRequest from './pages/InviteRequest';
import DeleteChannel from './pages/DeleteChannel';

import RedirectOnce from './components/RedirectOnce';

function App({ network, checkNetwork }) {
  // Check if the window as reopened and network is ready
  useEffect(() => {
    checkNetwork();
  }, [ checkNetwork ]);

  if (network.isReady) {
    return <Router>
      <ChannelLayout>
        <RedirectOnce/>
        <Route path='/new-channel' exact component={NewChannel}/>
        <Route path='/new-feed' exact component={NewFeed}/>
        <Route path='/request-invite' exact component={InviteRequest}/>
        <Route path='/channel/:id/' exact component={Channel}/>
        <Route path='/channel/:id/delete' exact component={DeleteChannel}/>
      </ChannelLayout>
    </Router>;
  }

  return <FullScreen>
    <SignIn/>
  </FullScreen>;
}

const mapStateToProps = (state) => {
  return {
    network: state.network,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    checkNetwork: (...args) => dispatch(checkNetwork(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
