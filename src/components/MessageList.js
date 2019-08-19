import React, { useState } from 'react';
import { connect } from 'react-redux';

import { loadMessages } from '../redux/actions';
import { keyToColor } from '../utils';

import './MessageList.css';

function MessageList({ channelId, channels, loadMessages } ) {
  const [ expandAuthorFor, setExpandAuthorFor ] = useState(null);
  const channel = channels.get(channelId);

  // Load only once per channel
  if (channel.messages.length === 0) {
    loadMessages({ channelId });
  }

  const messages = channel.messages.map((message) => {
    if (message.isRoot) {
      return null;
    }

    const publicKeys = message.author.publicKeys;
    const displayPath = message.author.displayPath.map((component, i) => {
      const style = { color: keyToColor(publicKeys[i]) };
      const name = component.trim().replace(/^#+/, '');
      return <span
        className='message-author-name'
        style={style}>
        {name}
      </span>;
    });

    const timestamp = new Date(message.timestamp * 1000);
    const time = timestamp.toLocaleTimeString();

    let author;
    let authorClass = 'message-author';
    if (displayPath.length === 0) {
      authorClass += ' message-author-root';
      author = `#${channel.name}`;
    } else if (expandAuthorFor === message.hash) {
      author = [];
      for (const component of displayPath) {
        author.push(component);
        author.push(<span>&gt;</span>);
      }
      author.pop();
    } else {
      author = displayPath[displayPath.length - 1];
    }

    const content = <div className='message-content-text'>
      {message.json.text || ''}
    </div>;

    const expandAuthor = (e) => {
      e.preventDefault();

      // Toggle
      if (expandAuthorFor === message.hash) {
        setExpandAuthorFor(null);
      } else {
        setExpandAuthorFor(message.hash);
      }
    };

    return <div className='message' key={message.hash}>
      <div className={authorClass} onClick={expandAuthor}>{author}</div>
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
