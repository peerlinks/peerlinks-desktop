import React, { useState } from 'react';

import './App.css';

import Channel from './pages/Channel';
import SignIn from './pages/SignIn';

import Bus from './bus';

const bus = new Bus('renderer');

export default function App() {
  const [ initialized, setInitialized ] = useState(false);
  const [ loading, setLoading ] = useState(false);

  const onPassphrase = (passphrase) => {
    setLoading(true);

    bus.send('network:passphrase', { passphrase });

    bus.waitFor('network:ready').promise.then(() => {
      // TODO(indutny): errors!
      setInitialized(true);
    });
  };

  return initialized ? <Channel/> :
    <SignIn isLoading={loading} onPassphrase={onPassphrase}/>;
}
