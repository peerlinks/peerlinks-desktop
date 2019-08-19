import React from 'react';
import { connect } from 'react-redux';

import MessageList from '../components/MessageList';
import Compose from '../components/Compose';

import './Channel.css';

function Channel({ match, channels }) {
  const channelId = match.params.id;
  const channel = channels.get(channelId);

  return <div className='channel-container'>
    <header className='channel-info'>
      <div className='channel-info-container'>
        <div className='channel-name'>#{channel.name}</div>
      </div>
    </header>
    <section className='channel-content'>
      <MessageList channelId={channelId}/>
    </section>
    <footer className='channel-compose'>
      <Compose channelId={channelId}/>
    </footer>
  </div>;
}

const mapStateToProps = (state) => {
  return {
    channels: state.channels,
  };
};

export default connect(mapStateToProps)(Channel);
