import React, { useState } from 'react';

import './App.css';

import Channel from './pages/Channel';
import SignIn from './pages/SignIn';

import Network from './network';

export default function App() {
  const [ initialized, setInitialized ] = useState(false);
  const [ loading, setLoading ] = useState(false);

  const network = new Network();

  const onPassphrase = (passphrase) => {
    setLoading(true);

    network.init(passphrase).then(() => {
      setInitialized(true);
    }).catch((err) => {
      console.error(err);
      // TODO(indutny): display error
    });
  };

  return initialized ? <Channel network={network}/> :
    <SignIn isLoading={loading} onPassphrase={onPassphrase}/>;
}
