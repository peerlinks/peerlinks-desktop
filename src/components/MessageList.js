import React, { useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';

import Message from './Message';

import './MessageList.css';

function MessageList({ channel, isSticky, setIsSticky }) {
  const [ expandAuthorFor, setExpandAuthorFor ] = useState(null);
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

export default connect(mapStateToProps)(MessageList);
