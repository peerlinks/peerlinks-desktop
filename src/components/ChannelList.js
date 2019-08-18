import React from 'react';

import './ChannelList.css';

export default function ChannelList(props) {
  const {
    selected,
    onChannelSelect,
    newChannel,
  } = props;

  const channels = props.channels.map((channel) => {
    let className = 'channel-list-elem';

    if (selected.id === channel.id) {
      className += ' channel-list-elem-active';
    }

    return (<div
      className={className}
      key={channel.id}
      onClick={() => onChannelSelect(channel)}>
      {channel.name}
    </div>);
  });

  return (<section className='channel-list'>
    <div className='channel-list-row'>
      {channels}
    </div>
    <div className='channel-list-row'>
      <button className='button' onClick={newChannel}>new channel</button>
    </div>
  </section>);
}
