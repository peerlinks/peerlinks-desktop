import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { connect } from 'react-redux';

import './ChannelList.css';

function ChannelList({ channelList }) {
  const list = channelList.map((channel) => {
    let unread;
    const unreadCount = channel.messageCount - channel.messagesRead;
    if (unreadCount > 0) {
      unread = <div className='channel-list-elem-unread'>
        {unreadCount}
      </div>
    }
    return <div className='channel-list-row' key={channel.id}>
      <NavLink
        className='channel-list-elem'
        activeClassName='channel-list-elem-active'
        to={`/channel/${channel.id}`}>
        <div className='channel-list-elem-left'>
          <span className='channel-list-elem-hash'>#</span>
          <span className='channel-list-elem-title'>{channel.name}</span>
        </div>
        {unread}
      </NavLink>
    </div>;
  });

  return <section className='channel-list'>
    {list}
    <div className='channel-list-row'>
      <Link className='button' to='/new-channel'>new channel</Link>
    </div>
  </section>;
}

const mapStateToProps = (state) => {
  return {
    channelList: Array.from(state.channels.values()).sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      } else if (a.name > b.name) {
        return 1;
      } else {
        return 0;
      }
    }),
  };
};

export default connect(mapStateToProps)(ChannelList);
