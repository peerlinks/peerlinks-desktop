import React, { useState } from 'react';

import ChannelList from '../components/ChannelList';
import MessageList from '../components/MessageList';

import './Channel.css';

export default function Channel({ network }) {
  const [ channel, setChannel ] = useState(null);

  const channels = [
    { id: 'a', name: 'a', canWrite: false, unread: 0 },
    { id: 'b', name: 'b', canWrite: true, unread: 0 },
    { id: 'c', name: 'c', canWrite: true, unread: 3 },
    {
      id: 'd',
      name: 'very long name that we gave to a channel',
      canWrite: true,
      unread: 3,
    },
  ];

  const messages = {
    a: [],
    b: [],
    c: [
      {
        hash: '1',
        author: [],
        timestamp: Date.now() - 60 * 1000,
        json: { text: 'I am root' },
      },
      {
        hash: '2',
        author: [ 'a' ],
        timestamp: Date.now() - 5000,
        json: { text: 'Hello root!' },
      },
      {
        hash: '3',
        author: [ 'a', 'b', 'c' ],
        timestamp: Date.now(),
        json: {},
      },
    ],
  };

  let content;
  if (messages[channel]) {
    content = <MessageList messages={messages[channel]}/>;
  }

  return (
    <div className='channel'>
      <aside className='sidebar'>
        {<ChannelList
          channels={channels}
          selected={channel}
          onChannelSelect={setChannel}/>}
      </aside>

      <div className='main'>
        <div className='main-container'>
          <header className='channel-info'>
            Information
          </header>
          <section className='channel-content'>
            {content}
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
        </div>
      </div>
    </div>
  );
}
