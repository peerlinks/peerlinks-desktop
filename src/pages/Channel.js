import React from 'react';

import MessageList from '../components/MessageList';

import './Channel.css';

export default function Channel() {
  return <div className='channel-container'>
    <header className='channel-info'>
      info
    </header>
    <section className='channel-content'>
      <MessageList channelId='okay'/>
    </section>
    <footer className='channel-compose'>
      <div className='channel-compose-container'>
        <button className='channel-compose-identity'>
          identity
        </button>
        <input
          className='channel-compose-text'
          type='text'
          placeholder='Write a message'/>
      </div>
    </footer>
  </div>;
}
