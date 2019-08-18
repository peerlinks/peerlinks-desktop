import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import { setCurrentChannel } from '../redux/actions';

import './ChannelList.css';

function ChannelList({ currentChannel, channelList, selectChannel }) {
  console.log(channelList);
  const list = channelList.map((channel) => {
    let className = 'channel-list-elem';

    if (currentChannel === channel.id) {
      className += ' channel-list-elem-active';
    }

    return <Link
      className={className}
      key={channel.id}
      to={`/channel/${channel.id}`}>
      {channel.name}
    </Link>;
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
    currentChannel: state.currentChannel,
    channelList: Object.keys(state.channels).map((channelId) => {
      return state.channels[channelId];
    }).sort((a, b) => {
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

const mapDispatchToProps = (dispatch) => {
  return {
    selectChannel(channelId) {
      dispatch(setCurrentChannel({ channelId }));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ChannelList);
