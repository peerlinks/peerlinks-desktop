import React, { useState } from 'react';
import { connect } from 'react-redux';

import network from '../network';
import { appendChannelMessage } from '../redux/actions';

const DISPLAY_COUNT = 1000;

function MessageList({ channelId, channels, appendMessage } ) {
  const [ loading, setLoading ] = useState(false);
  const [ error, setError ] = useState(null);

  const messages = channels.get(channelId).messages;

  const load = async () => {
    const count = await network.getMessageCount({ channelId });
    const messages = await network.getMessagesAtOffset({
      channelId,
      offset: Math.max(0, count - DISPLAY_COUNT),
      limit: DISPLAY_COUNT,
    });

    for (const message of messages) {
      appendMessage({ channelId, message });
    }
  };

  // We should have at least the root itself
  if (messages.length === 0 && !loading) {
    setLoading(true);
    load().catch((e) => {
      setError(e);
    }).finally(() => {
      setLoading(false);
    });
  }

  return <div className='message-list'>
    {error && <p className='error'>{error.stack}</p>}
    {loading && <p className='loading'>...loading</p>}
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
