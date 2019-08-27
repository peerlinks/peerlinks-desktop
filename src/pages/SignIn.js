import React, { useState } from 'react';
import { connect } from 'react-redux';

import { initNetwork, eraseNetwork, networkError } from '../redux/actions';

import './SignIn.css';

const MAX_DECRYPT_ATTEMPTS = 3;

const SignIn = ({ network, initNetwork, eraseNetwork }) => {
  const [ passphrase, setPassphrase ] = useState('');
  const [ confirm, setConfirm ] = useState('');
  const [ confirmErase, setConfirmErase ] = useState(false);

  const isDisabled = network.isFirstRun ? confirm !== passphrase : false;

  const onPassphraseChange = (e) => {
    setPassphrase(e.target.value);
  };

  const onConfirmChange = (e) => {
    setConfirm(e.target.value);
  };

  const onErase = (e) => {
    e.preventDefault();

    if (confirmErase) {
      eraseNetwork();
      setConfirmErase(false);
    } else {
      setConfirmErase(true);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (isDisabled) {
      return;
    }

    initNetwork({ passphrase });

    setPassphrase('');
    setConfirm('');
  };

  let confirmField;
  if (network.isFirstRun) {
    confirmField = <div className='form-row'>
      <input
        className='form-input'
        type='password'
        required
        value={confirm}
        onChange={onConfirmChange}
        placeholder='Confirm passphrase'/>
    </div>;
  }

  let errorRow;
  if (network.error) {
    errorRow = <div className='form-row error'>
      Got error: {network.error}
    </div>;
  }

  let eraseRow;
  if (network.decryptAttempts > MAX_DECRYPT_ATTEMPTS) {
    eraseRow = <div className='form-row'>
      <button
        className='button button-danger'
        onClick={onErase}>
        {confirmErase ? 'Are you sure?' : 'Erase all content' }
      </button>
    </div>;
  }

  const form = <form onSubmit={onSubmit}>
    {errorRow}
    <div className='form-row'>
      <h3 className='title'>Decrypt private keys</h3>
    </div>
    <div className='form-row'>
      <input
        className='form-input'
        type='password'
        required
        value={passphrase}
        onChange={onPassphraseChange}
        placeholder='Enter passphrase'/>
    </div>
    {confirmField}
    <div className='form-row'>
      <input
        className='button'
        type='submit'
        disabled={isDisabled}
        value='Sign In'/>
    </div>
    {eraseRow}
  </form>;

  return <div className='sign-in-container'>
    {network.isLoading ? <h3>Decrypting...</h3> : form}
  </div>;
}

const mapStateToProps = (state) => {
  return {
    network: state.network,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    initNetwork: (...args) => dispatch(initNetwork(...args)),
    eraseNetwork: (...args) => dispatch(eraseNetwork(...args)),
    networkError: (...args) => dispatch(networkError(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SignIn);
