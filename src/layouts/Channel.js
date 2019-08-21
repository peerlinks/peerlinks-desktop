import React from 'react';
import { Link } from 'react-router-dom';

import ChannelList from '../components/ChannelList';
import Notifications from '../components/Notifications';

import './Channel.css';

export default function ChannelLayout({ children }) {
  const newChannel = <Link
    className='new-channel-button'
    to='/new-channel'
    title='New channel and identity'>
    +
  </Link>;
  return <div className='channel-layout'>
    <Notifications/>

    <aside className='channel-layout-sidebar'>
      <h3 className='title'>channels {newChannel}</h3>
      <ChannelList/>
    </aside>

    <div className='channel-layout-main'>
      {children}
    </div>
  </div>;
}
