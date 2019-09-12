import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Picker } from 'emoji-mart'

import { postMessage, updateComposeState } from '../redux/actions';
import SelectIdentity, { Option } from './SelectIdentity';

import 'emoji-mart/css/emoji-mart.css'

import './Compose.css';

function Compose(props) {
  const {
    identities,
    channelId,
    postMessage,
    onBeforePost,

    state,
    updateState,
  } = props;

  const { identityKey = null, message = '' } = state[channelId] || {};

  const setMessage = (newMessage) => {
    if (message === newMessage) {
      return;
    }
    updateState({ channelId, state: { message: newMessage } });
  };
  const setIdentityKey = (newIdentityKey) => {
    if (identityKey === newIdentityKey) {
      return;
    }
    updateState({ channelId, state: { identityKey: newIdentityKey } });
  };

  const [ isPickerVisible, setIsPickerVisible ] = useState(false);
  const input = useRef();

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!e.key || e.metaKey || e.ctrlKey) {
        return;
      }

      if (input.current && !isPickerVisible) {
        input.current.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  });

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

  const toggleEmoji = (e) => {
    const wasVisible = isPickerVisible;
    setIsPickerVisible(!wasVisible);

    if (wasVisible && input.current) {
      input.current.focus();
    }
  };

  const appendEmoji = (e) => {
    setMessage(message + e.native);
  };

  const onSubmit = (e) => {
    e.preventDefault();
  };

  const onTextFocus = (e) => {
    if (isPickerVisible) {
      toggleEmoji();
    }
  };

  const onKeyDown = (e) => {
    if (e.key !== 'Enter') {
      return;
    }

    // [shift]+enter
    if (e.shiftKey) {
      return;
    }

    e.preventDefault();

    // Empty message is not allowed
    if (!message) {
      return;
    }

    onBeforePost();

    postMessage({
      channelId,
      identityKey,
      text: message,
    });

    setMessage('');
  };

  const lineCount = message.split(/\r\n|\n|\r/g).length;

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
      <textarea
        className='channel-compose-text'
        ref={input}
        onFocus={onTextFocus}
        rows={lineCount}
        type='text'
        placeholder='Write a message'
        title='Press `Shift+Enter` for multiline text'
        value={message}
        onChange={onMessageChange}
        onKeyDown={onKeyDown}/>
    </div>
    <div className='channel-compose-emoji-container'>
      <div className='channel-compose-emoji'>
        <button
          className='channel-compose-emoji-button'
          title='emoji'
          onClick={toggleEmoji}/>
      </div>
    </div>
    <Picker
      native

      style={{ display: isPickerVisible ? 'block' : 'none' }}

      /* NOTE: Disable bottom bar */
      showPreview={false}
      showSkinTones={false}

      onSelect={appendEmoji}
      emoji='grin'
      title='Pick an emoji'
    />
  </form>;
}

const mapStateToProps = (state) => {
  return {
    identities: state.identities,
    state: state.compose,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    postMessage: (...args) => dispatch(postMessage(...args)),
    updateState: (...args) => dispatch(updateComposeState(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Compose);
