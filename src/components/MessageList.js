import React, { useState } from 'react';
import { connect } from 'react-redux';

import { loadMessages } from '../redux/actions';

import Message from './Message';

import './MessageList.css';

function MessageList({ channelId, channels, loadMessages } ) {
  const [ expandAuthorFor, setExpandAuthorFor ] = useState(null);
  const channel = channels.get(channelId);

  // Load only once per channel
  if (channel.messages.length === 0) {
    loadMessages({ channelId });
  }

  const messages = channel.messages.map((message) => {
    const isExpanded = expandAuthorFor === message.hash;

    const expandAuthor = (e) => {
      e.preventDefault();

      // Toggle
      if (isExpanded) {
        setExpandAuthorFor(null);
      } else {
        setExpandAuthorFor(message.hash);
      }
    };

    return <Message
      channel={channel}
      message={message}
      isExpanded={isExpanded}
      onExpand={expandAuthor}/>;
  });

  return <div className='message-list'>
    {messages}
  </div>;
}

const mapStateToProps = (state) => {
  return {
    channels: state.channels,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    loadMessages: (...args) => dispatch(loadMessages(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(MessageList);
