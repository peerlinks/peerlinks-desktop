import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Picker } from 'emoji-mart';

import { postMessage, updateComposeState, postFile, addNotification } from '../redux/actions';
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
    messages,

    state,
    updateState,
  } = props;

  const { identityKey = null, message = '', usersRecentMessages = [] } = state;

  const RECENT_MESSAGES_LIMIT = 10;

  const setMessage = (newMessage) => {
    if (message === newMessage) {
      return;
    }
    updateState({ channelId, state: { message: newMessage } });
  };

  const getRecentMessages = (identityKey) => {
    const recentMessages = [];

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];

      if(!message.isRoot && message.author.publicKeys.some(pubKey => pubKey === identityKey)) {
        const newLength = recentMessages.push(message);

        if(newLength === RECENT_MESSAGES_LIMIT) {
          break;
        }
      }
    }

    recentMessages.reverse();

    return recentMessages;
  };

  const setUsersRecentMessages = (newIdentityKey) => {
    if (identityKey === newIdentityKey) {
      return;
    }

    const usersRecentMessages = getRecentMessages(newIdentityKey);

    updateState({
      channelId,
      state: { usersRecentMessages },
    });
  };

  const getNextMessage = (code) => {
    if(!message) {
      return usersRecentMessages[usersRecentMessages.length - 1].json.text;
    }

    const recentIndex = usersRecentMessages.findIndex(urm => urm.json.text === message);

    if(message && recentIndex !== -1) {
      let nextIndex = 0;
      const length = usersRecentMessages.length;

      if(code === 'ArrowUp') {
        nextIndex = Math.abs((recentIndex - 1 + length) % length);
      }
      if(code === 'ArrowDown') {
        nextIndex = Math.abs((recentIndex + 1) % length);
      }

      const nextMessage = usersRecentMessages[nextIndex].json.text;

      return nextMessage;
    }

    return null;
  };

  const setIdentityKey = (newIdentityKey) => {
    if (identityKey === newIdentityKey) {
      return;
    }

    const usersRecentMessages = getRecentMessages(newIdentityKey);

    updateState({
      channelId,
      state: { identityKey: newIdentityKey, usersRecentMessages },
    });
  };

  const [ isPickerVisible, setIsPickerVisible ] = useState(false);
  const input = useRef();

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!e.key || e.metaKey || e.ctrlKey) {
        return;
      }

      // if the user selects a different identity, the focus will be on the select
      // this is used to allow up/down to cycle through identities if the focus is on select
      const isSelect = e.target.nodeName === 'SELECT';

      const isUpOrDown = e.code === 'ArrowUp' || e.code === 'ArrowDown';

      if (input.current && !isPickerVisible) {
        if (!isSelect) {
          const areMessages = usersRecentMessages.length > 0;

          // so only the up key starts the cycle through recent messages
          const keyDownNoMessage = (!message && e.code === 'ArrowDown');

          if (areMessages &&  isUpOrDown && !isSelect && !keyDownNoMessage) {
            const nextMessage = getNextMessage(e.code);

            if(nextMessage !== null && nextMessage !== message) {
              setMessage(nextMessage);
            }
          }
          input.current.focus();
        } else if(isSelect && !isUpOrDown) { // so non up/down keys bring focus to textarea
          input.current.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
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

  // Select first identity
  if (!identityKey) {
    setIdentityKey(identities[0].publicKey);
  }

  if (messages.length && identityKey) {
    setUsersRecentMessages(identityKey);
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

  const onKeyDown = (e) => {
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
        onKeyDown={onKeyDown}/>
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
  messages: PropTypes.array,

  state: PropTypes.exact({
    identityKey: PropTypes.string,
    message: PropTypes.string,
    usersRecentMessages: PropTypes.array,
  }),

  postMessage: PropTypes.func.isRequired,
  onBeforePost: PropTypes.func.isRequired,
  postFile: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  updateState: PropTypes.func.isRequired,
};

const mapStateToProps = (state, { channelId }) => {
  // Filter identities that can post to the channel
  // TODO(indutny): expiration
  const identities = Array.from(state.identities.values())
    .filter((identity) => identity.channelIds.includes(channelId));

  return {
    identities,
    messages: state.channels.get(channelId).messages || [],
    state: state.compose[channelId] || {},
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    postMessage: (...args) => dispatch(postMessage(...args)),
    updateState: (...args) => dispatch(updateComposeState(...args)),
    postFile: (...args) => dispatch(postFile(...args)),
    addNotification: (...args) => dispatch(addNotification(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Compose);
