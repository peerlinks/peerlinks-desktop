import React from 'react';
import { connect } from 'react-redux';

import { loadMessages } from '../redux/actions';
import { keyToColor } from '../utils';

import './MessageList.css';

function MessageList({ channelId, channels, loadMessages } ) {
  const channel = channels.get(channelId);

  // Load only once per channel
  if (channel.messages.length === 0) {
    loadMessages({ channelId });
  }

  const messages = channel.messages.map((message) => {
    if (message.isRoot) {
      return null;
    }

    const displayPath = message.author.displayPath;
    const publicKeys = message.author.publicKeys;

    const timestamp = new Date(message.timestamp * 1000);
    const time = timestamp.toLocaleTimeString();

    let author;
    let style;
    let authorClass = 'message-author';
    if (displayPath.length === 0) {
      authorClass += ' message-author-root';
      author = `#${channel.name}`;
    } else {
      author = displayPath[displayPath.length - 1];
      author = author.trim().replace(/^#+/, '');

      const publicKey = publicKeys[publicKeys.length - 1];
      style = { color: keyToColor(publicKey) };
    }

    const content = <div className='message-content-text'>
      {message.json.text || ''}
    </div>;

    return <div className='message' key={message.hash}>
      <div className={authorClass} style={style}>{author}</div>
      <div className='message-content'>{content}</div>
      <div className='message-time'>{time}</div>
    </div>;
  }).filter((message) => message);

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
