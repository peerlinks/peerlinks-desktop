import React from 'react';
import PropTypes from 'prop-types';

import './Message.css';
import File from '../components/ui/File';

const Message = React.memo(function Message (props) {
  const { channelName, message, isExpanded, setExpandAuthorFor } = props;
  if (message.isRoot) {
    return null;
  }

  const enriched = message.enriched;

  const displayPath = enriched.displayPath.map((component, i) => {
    const style = { color: component.color };
    return <span
      key={i}
      className='message-author-name'
      style={style}
      title={component.publicKey}>
      {component.name}
    </span>;
  });

  let author;
  let authorClass = 'message-author';
  if (displayPath.length === 0) {
    authorClass += ' message-author-root';
    author = `#${channelName}`;
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

  const onExpand = (e) => {
    e.preventDefault();

    // Toggle
    if (isExpanded) {
      setExpandAuthorFor(null);
    } else {
      setExpandAuthorFor(message.hash);
    }
  };

  return <div className='message'>
    <div className='message-time-container'>
      <div className='message-time' title={enriched.time.full}>
        {enriched.time.short}
      </div>
    </div>
    <div className='message-content-container'>
      <div className='message-content'>
        <span className={authorClass} onClick={onExpand}>{author}</span>:&nbsp;
        <span className='message-text'>{enriched.file ? <File {...enriched.file} /> : enriched.text}</span>
      </div>
    </div>
  </div>;
});

Message.propTypes = {
  channelName: PropTypes.string.isRequired,
  message: PropTypes.shape({
    isRoot: PropTypes.bool.isRequired,
    hash: PropTypes.string.isRequired,
    enriched: PropTypes.shape({
      displayPath: PropTypes.arrayOf(PropTypes.shape({
        color: PropTypes.string.isRequired,
        publicKey: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      })),
      time: PropTypes.shape({
        full: PropTypes.string.isRequired,
        short: PropTypes.string.isRequired,
      }),
      file: PropTypes.object,
      text: PropTypes.string,
    }),
  }),
  isExpanded: PropTypes.bool.isRequired,
  setExpandAuthorFor: PropTypes.func.isRequired,
};

export default Message;
