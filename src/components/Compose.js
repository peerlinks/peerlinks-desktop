import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { postMessage } from '../redux/actions';
import SelectIdentity, { Option } from './SelectIdentity';

import './Compose.css';

function Compose({ identities, channelId, postMessage, onBeforePost }) {
  const [ identityKey, setIdentityKey ] = useState(null);
  const [ savedState, setSavedState ] = useState(new Map());
  const [ message, setMessage ] = useState('');
  const [ lastChannel, setLastChannel ] = useState(null);
  const input = useRef();

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!e.key || e.metaKey || e.ctrlKey) {
        return;
      }

      if (input.current) {
        input.current.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  });

  const restore = (channelId) => {
    if (!channelId) {
      return;
    }

    const state = savedState.get(channelId);
    if (state) {
      setMessage(state.message);
      setIdentityKey(state.identityKey);
    } else {
      setMessage('');
      setIdentityKey(null);
    }
  };

  const save = (channelId) => {
    if (!channelId) {
      return;
    }

    const copy = new Map(savedState);
    copy.set(channelId, { message, identityKey });
    setSavedState(copy);
  };

  // Reset on channelId change
  if (lastChannel !== channelId) {
    save(lastChannel);
    restore(channelId);

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
      <p>
        No write access to channel,&nbsp;
        <Link to='/new-channel'>request invite</Link>
      </p>
    </div>;
  }

  const options = availableIdentities.map((identity) => {
    return <Option
      key={identity.publicKey}
      value={identity.publicKey}
      label={identity.name}/>;
  });

  // Select first identity
  if (!identityKey) {
    setIdentityKey(availableIdentities[0].publicKey);
  }

  const onIdentityChange = (value) => {
    setIdentityKey(value);
  };

  const onMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const onSubmit = (e) => {
    e.preventDefault();

    onBeforePost();

    postMessage({
      channelId,
      identityKey,
      text: message,
    });

    setMessage('');
  };

  return <form className='channel-compose-container' onSubmit={onSubmit}>
    <div className='channel-compose-identity-container'>
      <SelectIdentity
        className='channel-compose-identity'
        value={identityKey}
        onChange={onIdentityChange}
        title='select identity'>
        {options}
      </SelectIdentity>
    </div>
    <div className='channel-compose-text-container'>
      <input
        ref={input}
        className='channel-compose-text'
        required
        type='text'
        placeholder='Write a message'
        value={message}
        onChange={onMessageChange}/>
    </div>
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
