import React from 'react';
import { connect } from 'react-redux';

import MessageList from '../components/MessageList';

import './Channel.css';

function Channel({ match, channels, identities }) {
  const channelId = match.params.id;
  const channel = channels.get(channelId);

  const options = Array.from(identities.values()).filter((identity) => {
    return identity.channelIds.includes(channelId);
  }).map((identity) => {
    return <option key={identity.publicKey} value={identity.publicKey}>
      {identity.name}
    </option>
  });

  return <div className='channel-container'>
    <header className='channel-info'>
      #{channel.name}
    </header>
    <section className='channel-content'>
      <MessageList channelId='okay'/>
    </section>
    <footer className='channel-compose'>
      <div className='channel-compose-container'>
        <select className='channel-compose-identity'>
          {options}
        </select>
        <input
          className='channel-compose-text'
          type='text'
          placeholder='Write a message'/>
      </div>
    </footer>
  </div>;
}

const mapStateToProps = (state) => {
  return {
    channels: state.channels,
    identities: state.identities,
  };
};

export default connect(mapStateToProps)(Channel);
