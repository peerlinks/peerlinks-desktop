import React from 'react';
import { connect } from 'react-redux';

import { appendChannelMessage } from '../redux/actions';

const DISPLAY_COUNT = 1000;

function MessageList({ channelId, channels, appendMessage } ) {
  const messages = channels.get(channelId).messages;

  // We should have at least the root itself
  if (messages.length === 0) {
  }

  return <div className='message-list'>
  </div>;
}

const mapStateToProps = (state) => {
  return {
    channels: state.channels,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    appendMessage({ channelId, message }) {
      dispatch(appendChannelMessage({ channelId, message }));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(MessageList);
