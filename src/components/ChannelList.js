import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { connect } from 'react-redux';

import './ChannelList.css';

function ChannelList({ channelList }) {
  const list = channelList.map((channel) => {
    let className = 'channel-list-elem';

    return <NavLink
      className={className}
      activeClassName='channel-list-elem-active'
      key={channel.id}
      to={`/channel/${channel.id}`}>
      <span className='channel-list-elem-hash'>#</span>
      <span className='channel-list-elem-title'>{channel.name}</span>
    </NavLink>;
  });

  return <section className='channel-list'>
    <div className='channel-list-row'>
      {list}
    </div>
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
