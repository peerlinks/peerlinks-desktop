import React from 'react';
import { NavLink } from 'react-router-dom';
import { connect } from 'react-redux';

import './ChannelList.css';

function ChannelList({ channelList }) {
  const list = channelList.map((channel) => {
    let unread;
    const unreadCount = channel.messageCount - channel.messagesRead;

    let elemClass = 'channel-list-elem';
    if (unreadCount > 0) {
      elemClass += ' channel-list-elem-unread';
    }
    return <div className='channel-list-row' key={channel.id}>
      <NavLink
        className={elemClass}
        activeClassName='channel-list-elem-active'
        to={`/channel/${channel.id}`}>
        <div className='channel-list-elem-left'>
          <span className='channel-list-elem-hash'>#</span>
          <span className='channel-list-elem-title'>{channel.name}</span>
        </div>
      </NavLink>
    </div>;
  });

  return <section className='channel-list'>
    {list}
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
