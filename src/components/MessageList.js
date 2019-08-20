import React, { useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';

import { loadMessages } from '../redux/actions';

import Message from './Message';

import './MessageList.css';

function MessageList({ channelId, channels, loadMessages } ) {
  const [ expandAuthorFor, setExpandAuthorFor ] = useState(null);
  const [ lastChannelId, setLastChannelId ] = useState(null);
  const [ isSticky, setIsSticky ] = useState(false);
  const view = useRef();

  useEffect(() => {
    if (isSticky && view.current) {
      const elem = view.current;
      elem.scrollTo({
        top: elem.scrollHeight - elem.clientHeight,
        left: 0,
      });
    }
  });

  // Stick to the bottom on channel change
  if (lastChannelId !== channelId) {
    setIsSticky(true);
    setLastChannelId(channelId);
  }

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
      key={message.hash}
      isExpanded={isExpanded}
      onExpand={expandAuthor}/>;
  });

  const onScroll = ({ target }) => {
    const scrollTop = target.scrollTop;
    const maxScrollTop = target.scrollHeight - target.clientHeight;

    // Scroll to the bottom
    setIsSticky(scrollTop === maxScrollTop);
  };

  return <div className='message-list' onScroll={onScroll} ref={view}>
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
