import React, { useState } from 'react';
import { connect } from 'react-redux';

import { postMessage } from '../redux/actions';

import './Compose.css';

function Compose({ identities, channelId, postMessage }) {
  const [ identityKey, setIdentityKey ] = useState(null);
  const [ message, setMessage ] = useState('');
  const [ lastChannel, setLastChannel ] = useState(null);

  // Reset on channelId change
  // TODO(indutny): preserve text?
  if (lastChannel !== channelId) {
    setIdentityKey(null);
    setMessage('');
    setLastChannel(channelId);
  }

  // Filter identities that can post to the channel
  // TODO(indutny): expiration
  let availableIdentities = Array.from(identities.values());
  availableIdentities = availableIdentities.filter((identity) => {
    return identity.channelIds.includes(channelId);
  });

  if (availableIdentities.length === 0) {
    return <div className='channel-compose-container'>
      <p>No write access to channel. Request an invite</p>
    </div>;
  }

  const options = availableIdentities.map((identity) => {
    return <option key={identity.publicKey} value={identity.publicKey}>
      {identity.name}
    </option>
  });

  // Select first identity
  if (!identityKey) {
    setIdentityKey(availableIdentities[0].publicKey);
  }

  const onIdentityChange = (e) => {
    setIdentityKey(e.target.value);
  };

  const onMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const onSubmit = (e) => {
    e.preventDefault();

    postMessage({
      channelId,
      identityKey,
      text: message,
    });

    setMessage('');
  };

  return <form className='channel-compose-container' onSubmit={onSubmit}>
    <select
      className='channel-compose-identity'
      value={identityKey}
      onChange={onIdentityChange}>
      {options}
    </select>
    <input
      className='channel-compose-text'
      required
      type='text'
      placeholder='Write a message'
      value={message}
      onChange={onMessageChange}/>
  </form>;
}

const mapStateToProps = (state) => {
  return {
    identities: state.identities,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    postMessage: (...args) => dispatch(postMessage(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Compose);
