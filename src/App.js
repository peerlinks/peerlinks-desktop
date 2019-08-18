import React, { useState } from 'react';

import './App.css';

import Index from './pages/Index';
import SignIn from './pages/SignIn';

import Network from './network';

const network = new Network();

export default function App() {
  const [ initialized, setInitialized ] = useState(false);
  const [ loading, setLoading ] = useState(false);

  const onPassphrase = (passphrase) => {
    setLoading(true);

    network.init(passphrase).then(() => {
      setInitialized(true);
    }).catch((err) => {
      console.error(err);
      // TODO(indutny): display error
    });
  };

  return initialized ? <Index network={network}/> :
    <SignIn isLoading={loading} onPassphrase={onPassphrase}/>;
}
