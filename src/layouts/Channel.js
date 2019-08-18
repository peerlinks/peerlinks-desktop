import React from 'react';

import ChannelList from '../components/ChannelList';

import './Channel.css';

export default function ChannelLayout({ children }) {
  return <div className='channel-layout'>
    <aside className='channel-layout-sidebar'>
      <h6 className='title'>channels:</h6>
      <ChannelList/>
    </aside>

    <div className='channel-layout-main'>
      {children}
    </div>
  </div>;
}
