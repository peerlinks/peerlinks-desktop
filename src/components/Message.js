import React from 'react';

import { keyToColor } from '../utils';

import './Message.css';

export default function Message({ channel, message, isExpanded, onExpand }) {
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
  } else if (isExpanded) {
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

  return <div className='message'>
    <div className={authorClass} onClick={onExpand}>{author}</div>
    <div className='message-content'>{content}</div>
    <div className='message-time'>{time}</div>
  </div>;
}
