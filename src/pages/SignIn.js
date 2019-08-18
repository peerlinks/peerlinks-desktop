import React, { useState } from 'react';

import './SignIn.css';

export default function SignIn({ isLoading, onPassphrase }) {
  const [ passphrase, setPassphrase ] = useState('');

  const onPassphraseChange = (e) => {
    setPassphrase(e.target.value);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    onPassphrase(passphrase);
  };

  const form = <form onSubmit={onSubmit}>
    <div className='sign-in-row'>
      <h3 className='title'>Decrypt private keys</h3>
    </div>
    <div className='sign-in-row'>
      <input
        className='sign-in-passphrase'
        type='password'
        required
        value={passphrase}
        onChange={onPassphraseChange}
        placeholder='Enter passphrase'/>
    </div>
    <div className='sign-in-row'>
      <input className='sign-in-submit button' type='submit' value='Sign In'/>
    </div>
  </form>;

  return <div className='sign-in'>
    {isLoading ? <h3>Decrypting...</h3> : form}
  </div>;
}
