import React from 'react';
import remark from 'remark';
import remarkReact from 'remark-react';
import remarkEmoji from 'remark-emoji';
import moment from 'moment';

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

  const time = moment(message.timestamp * 1000).format('hh:mm:ss');

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

  const text = remark().use(remarkReact).use(remarkEmoji).processSync(
    message.json.text || '').contents;

  return <div className='message'>
    <div className='message-time-container'>
      <div className='message-time'>{time}</div>
    </div>
    <div className='message-content-container'>
      <div className='message-content'>
        <span className={authorClass} onClick={onExpand}>{author}</span>:&nbsp;
        <span className='message-text'>{text}</span>
      </div>
    </div>
  </div>;
}
