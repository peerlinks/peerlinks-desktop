import React, { useState } from 'react';
import { connect } from 'react-redux';

import { loadMessages } from '../redux/actions';

const DISPLAY_COUNT = 1000;

const pad2 = (number) => {
  let str = number.toString();
  while (str.length < 2) {
    str = '0' + str;
  }
  return str;
};

function MessageList({ channelId, channels, loadMessages } ) {
  const [ currentChannel, setCurrentChannel ] = useState(null);

  const messages = channels.get(channelId).messages.map((message) => {
    let timestamp = new Date(message.timestamp * 1000);
    timestamp = pad2(timestamp.getHours()) + ':' +
      pad2(timestamp.getMinutes()) + ':' +
      pad2(timestamp.getSeconds());

    const author = message.author.displayPath.join('>');
    const text = message.isRoot ? '<root>' : message.json.text || '';

    return <div className='message-list-message' key={message.hash}>
      {timestamp} [{author}]: {text}
    </div>;
  });

  if (messages.length === 0 && currentChannel !== channelId) {
    setCurrentChannel(channelId);

    loadMessages({ channelId, limit: DISPLAY_COUNT });
  }

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
