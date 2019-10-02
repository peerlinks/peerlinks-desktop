import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { NavLink, Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

import './ChannelList.css';

const renderChannel = (channel) => {
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
      <span className='channel-list-elem-hash'>#</span>
      <span className='channel-list-elem-title'>{channel.name}</span>
    </NavLink>
  </div>;
};

const ChannelList = withRouter(({ history, identityCount, channelList }) => {
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

      if (digit >= channels.length + feeds.length) {
        return;
      }

      const channel = channels[digit] || feeds[digit - channels.length];
      history.replace(`/channel/${channel.id}/`);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  });

  const channels = [];
  const feeds = [];
  for (const channel of channelList) {
    if (channel.isFeed) {
      feeds.push(channel);
    } else {
      channels.push(channel);
    }
  }

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

  let requestInvite;
  if (identityCount !== 0) {
    requestInvite = <section className='channel-list-sub'>
      <NavLink
        className='channel-list-request-invite'
        activeClassName='channel-list-request-invite-active'
        to='/request-invite'>
        request invite
      </NavLink>
    </section>;
  }

  return <section className='channel-list'>
    <section className='channel-list-sub'>
      <h3 className='title'>channels {newChannel}</h3>
      {channels.map(renderChannel)}
    </section>
    <section className='channel-list-sub'>
      <h3 className='title'>feeds {newFeed}</h3>
      {feeds.map(renderChannel)}
    </section>
    {requestInvite}
    <section className='channel-list-sub'>
      <NavLink
        className='channel-list-import-feed'
        activeClassName='channel-list-import-feed-active'
        to='/import-feed'>
        import feed
      </NavLink>
    </section>
  </section>;
});

ChannelList.propTypes = {
  identityCount: PropTypes.number.isRequired,
  channelList: PropTypes.arrayOf(PropTypes.shape({
    isFeed: PropTypes.bool.isRequired,
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    messageCount: PropTypes.number.isRequired,
    metadata: PropTypes.shape({
      readCount: PropTypes.number,
    }),
  })),
};

const mapStateToProps = (state) => {
  return {
    identityCount: state.identities.size,
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
