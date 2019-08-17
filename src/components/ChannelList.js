import React from 'react';

import './ChannelList.css';

export default function ChannelList(props) {
  const channels = props.channels.map((channel) => {
    let className = 'channel-list-elem';

    if (props.selected === channel.id) {
      className += ' channel-list-elem-active';
    }

    return (<div
      className={className}
      key={channel.id}
      onClick={() => props.onChannelSelect(channel.id)}>
      {channel.name}
    </div>);
  });

  return (<section className='channel-list'>
    <h6 className='title'>channels:</h6>

    {channels}
  </section>);
}
