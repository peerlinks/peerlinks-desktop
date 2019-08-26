import React, { useEffect } from 'react';
import { NavLink, Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

import './ChannelList.css';

const ChannelList = withRouter(({ history, channelList }) => {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!e.metaKey && !e.ctrlKey) {
        return;
      }

      // cmd+digit, ctrl+digit
      if (!/^\d$/.test(e.key)) {
        return;
      }

      let digit = parseInt(e.key, 10);
      if (digit === 0) {
        digit = 9;
      } else {
        digit--;
      }

      if (digit >= channelList.length) {
        return;
      }

      const channel = channelList[digit];
      history.replace(`/channel/${channel.id}/`);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  });

  const list = channelList.map((channel) => {
    const unreadCount = channel.messageCount -
      (channel.metadata.readCount || 0);

    let elemClass = 'channel-list-elem';
    if (unreadCount > 0) {
      elemClass += ' channel-list-elem-unread';
    }
    return <div className='channel-list-row' key={channel.id}>
      <NavLink
        className={elemClass}
        activeClassName='channel-list-elem-active'
        to={`/channel/${channel.id}/`}>
        <div className='channel-list-elem-left'>
          <span className='channel-list-elem-hash'>#</span>
          <span className='channel-list-elem-title'>{channel.name}</span>
        </div>
      </NavLink>
    </div>;
  });

  const newChannel = <Link
    className='new-channel-button'
    to='/new-channel'
    title='New channel and identity'>
  </Link>;

  const newFeed = <Link
    className='new-channel-button'
    to='/new-feed'
    title='New read-only feed'>
  </Link>;

  return <section className='channel-list'>
    <h3 className='title'>channels {newChannel}</h3>
    {list}
    <h3 className='title'>feeds {newFeed}</h3>
  </section>;
});

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
