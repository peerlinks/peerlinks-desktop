import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Picker } from 'emoji-mart';

import {
  postMessage,

  updateComposeIdentity,
  updateComposeMessage, addComposeMessage, changeComposeMessage,
  postFile, addNotification,
} from '../redux/actions';
import { convertFileToBase64, getAttachmentsPayload } from '../redux/utils';
import SelectIdentity, { Option } from './SelectIdentity';

import 'emoji-mart/css/emoji-mart.css';
import './Compose.css';

// TODO(indutny): pull the size limit from `@peerlinks/protocol`
const SIZE_LIMIT = 2097152;

function Compose(props) {
  const {
    identities,
    channelId,
    postMessage,
    onBeforePost,
    postFile,
    addNotification,

    identityKey,
    message,

    updateIdentity,

    updateMessage,
    addMessage,
    changeMessage,
  } = props;

  const setMessage = (newMessage) => {
    if (message === newMessage) {
      return;
    }
    updateMessage({ channelId, message: newMessage });
  };

  const setIdentityKey = (newIdentityKey) => {
    if (identityKey === newIdentityKey) {
      return;
    }
    updateIdentity({ channelId, identityKey: newIdentityKey });
  };

  const [ isPickerVisible, setIsPickerVisible ] = useState(false);
  const input = useRef();

  useEffect(() => {
    const onGlobalKeyDown = (e) => {
      if (!e.key || e.metaKey || e.ctrlKey) {
        return;
      }

      if (input.current && !isPickerVisible) {
        input.current.focus();
      }
    };
    document.addEventListener('keydown', onGlobalKeyDown);

    return () => {
      document.removeEventListener('keydown', onGlobalKeyDown);
    };
  });

  if (identities.length === 0) {
    return <div className='channel-compose-container'>
      <p>
        No write access to channel,&nbsp;
        <Link to='/new-channel'>request invite</Link>
      </p>
    </div>;
  }

  const options = identities.map((identity) => {
    return <Option
      key={identity.publicKey}
      value={identity.publicKey}
      label={identity.name}/>;
  });

  const keyFromDeletedIdentity = identities.every(
    identity => identity.publicKey !== identityKey
  );

  // Select first identity
  if (!identityKey || keyFromDeletedIdentity) {
    setIdentityKey(identities[0].publicKey);
  }

  const onIdentityChange = (value) => {
    setIdentityKey(value);
  };

  const onMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const toggleEmoji = (e) => {
    if (e) {
      e.preventDefault();
    }

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

  const onTextFocus = () => {
    if (isPickerVisible) {
      toggleEmoji();
    }
  };

  const onArrowKeyDown = (e) => {
    if (!e.key || e.metaKey || e.ctrlKey) {
      return false;
    }

    const isUp = e.key === 'ArrowUp';
    const isDown = e.key === 'ArrowDown';
    if (!isUp && !isDown) {
      return false;
    }

    const isMultiline = /[\n\r]/.test(message);

    // Do not switch messages when writing several lines
    if (isMultiline) {
      return false;
    }

    changeMessage({ channelId, isNext: isDown });
    return true;
  };

  const onComposeKeyDown = (e) => {
    if (onArrowKeyDown(e)) {
      e.preventDefault();
      return;
    }

    if (e.key !== 'Enter') {
      return;
    }

    e.preventDefault();

    // [shift]+enter
    if (e.shiftKey) {
      // TODO(indutny): find a way for predictable newlines without
      // changing user input in obscure way
      setMessage(message + '  \n');
      return;
    }

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

    addMessage({ channelId });

    setMessage('');
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = handleInputChange;
    input.click();
  };

  const handleInputChange = (e) => {
    e.preventDefault();
    const { type, name, size } = e.target.files[0];

    if (size > SIZE_LIMIT) {
      addNotification({
        kind: 'error',
        content: 'This file is to big (2mb max) !',
      });
    } else {
      convertFileToBase64(e.target.files[0])
        .then(data => {
          onBeforePost();
          postFile({
            channelId,
            identityKey,
            files: [ {
              ...getAttachmentsPayload(name, type || 'default', data),
            } ],
          });
          setMessage('');
        });
    }
  };

  const lineCount = message.split(/\r\n|\n|\r/g).length;

  return <form className='channel-compose-container' onSubmit={onSubmit}>
    <div className='channel-compose-identity-container'>
      <SelectIdentity
        className='channel-compose-identity'
        value={identityKey || ''}
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
        onKeyDown={onComposeKeyDown}/>
    </div>
    <div className='channel-compose-emoji-container'>
      <div className='channel-compose-emoji'>
        <button
          className='channel-compose-upload-button'
          title='upload file'
          onClick={handleUpload}
        />
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

Compose.propTypes = {
  identities: PropTypes.array.isRequired,
  channelId: PropTypes.string.isRequired,

  identityKey: PropTypes.string,
  message: PropTypes.string,

  postMessage: PropTypes.func.isRequired,
  onBeforePost: PropTypes.func.isRequired,
  postFile: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,

  updateIdentity: PropTypes.func.isRequired,

  updateMessage: PropTypes.func.isRequired,
  addMessage: PropTypes.func.isRequired,
  changeMessage: PropTypes.func.isRequired,
};

const mapStateToProps = (state, { channelId }) => {
  // Filter identities that can post to the channel
  // TODO(indutny): expiration
  const identities = Array.from(state.identities.values())
    .filter((identity) => identity.channelIds.includes(channelId));

  const {
    identityKey = null,
    messages = [ '' ],
    messageIndex = 0,
  } = state.compose[channelId] || {};

  return {
    identities,
    identityKey,
    message: messages[messageIndex],
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    postMessage: (...args) => dispatch(postMessage(...args)),
    postFile: (...args) => dispatch(postFile(...args)),
    addNotification: (...args) => dispatch(addNotification(...args)),

    updateIdentity: (...args) => dispatch(updateComposeIdentity(...args)),

    updateMessage: (...args) => dispatch(updateComposeMessage(...args)),
    addMessage: (...args) => dispatch(addComposeMessage(...args)),
    changeMessage: (...args) => dispatch(changeComposeMessage(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Compose);
