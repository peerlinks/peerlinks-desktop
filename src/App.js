import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { HashRouter as Router, Route } from 'react-router-dom';

import './Fonts.css';
import './App.css';

import { checkNetwork, setFocus } from './redux/actions';

import FullScreen from './layouts/FullScreen';
import ChannelLayout from './layouts/Channel';

import Channel from './pages/Channel';
import SignIn from './pages/SignIn';
import NewChannel from './pages/NewChannel';
import ImportFeed from './pages/ImportFeed';
import InviteRequest from './pages/InviteRequest';
import DeleteChannel from './pages/DeleteChannel';

import RedirectOnce from './components/RedirectOnce';

function App({ network, checkNetwork, setFocus }) {
  // Check if the window as reopened and network is ready
  useEffect(() => {
    checkNetwork();
  }, [ checkNetwork ]);

  // Propagate focus/blur state changes to redux
  useEffect(() => {
    const onFocus = () => {
      setFocus(true);
    };

    const onBlur = () => {
      setFocus(false);
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, [ setFocus ]);

  if (network.isReady) {
    return <Router>
      <ChannelLayout>
        <RedirectOnce/>
        <Route path='/new-channel' exact render={() => {
          return <NewChannel isFeed={false}/>;
        }}/>
        <Route path='/new-feed' exact render={() => {
          return <NewChannel isFeed={true}/>;
        }}/>
        <Route path='/import-feed' exact component={ImportFeed}/>
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
    setFocus: (...args) => dispatch(setFocus(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
