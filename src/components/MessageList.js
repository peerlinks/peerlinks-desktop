import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Message from './Message';

import './MessageList.css';

const MessageList = React.memo(function MessageList (props) {
  const { channelName, readHeight, messages, isSticky, setIsSticky } = props;

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

  const rows = messages.map((message) => {
    const isExpanded = expandAuthorFor === message.hash;

    return <Message
      channelName={channelName}
      message={message}
      key={message.hash}
      isExpanded={isExpanded}
      setExpandAuthorFor={setExpandAuthorFor}/>;
  });

  const marker = messages.findIndex((message) => {
    return message.height > readHeight;
  });

  if (marker > 0) {
    rows.splice(marker, 0, <hr key='unread-marker'/>);
  }

  const onScroll = ({ target }) => {
    const scrollTop = target.scrollTop;
    const maxScrollTop = target.scrollHeight - target.clientHeight;

    // Scroll to the bottom
    setIsSticky(scrollTop === maxScrollTop);
  };

  return <div className='message-list' onScroll={onScroll} ref={view}>
    {rows}
  </div>;
});

MessageList.propTypes = {
  channelName: PropTypes.string.isRequired,
  readHeight: PropTypes.number.isRequired,
  messages: PropTypes.arrayOf(PropTypes.shape({
    hash: PropTypes.string.isRequired,
    height: PropTypes.number.isRequired,
  })),
  isSticky: PropTypes.bool.isRequired,
  setIsSticky: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  return {
    channels: state.channels,
  };
};

export default connect(mapStateToProps)(MessageList);
