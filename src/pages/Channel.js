import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { getFeedURL } from '../utils';

import {
  channelMarkRead, loadMessages, toggleSilence, channelUpdateReadHeight,
  displayFeedURL, displayHelp,
} from '../redux/actions';

import MessageList from '../components/MessageList';
import Compose from '../components/Compose';
import UserList from '../components/UserList';

import './Channel.css';

function Channel (props) {
  const {
    match, channel, markRead, loadMessages,
    toggleSilence, updateReadHeight,
    displayFeedURL, displayHelp,
  } = props;
  const [ lastChannelId, setLastChannelId ] = useState(null);
  const [ isSticky, setIsSticky ] = useState(false);
  const [ isUserListVisible, setIsUserListVisible ] = useState(false);

  const channelId = match.params.id;
  if (!channel) {
    return null;
  }

  if (lastChannelId !== channelId) {
    if (lastChannelId) {
      markRead({ channelId: lastChannelId });
      updateReadHeight({ channelId: lastChannelId });
    }

    setLastChannelId(channelId);

    // Load only once per channel
    if (channel.messages.length === 0) {
      loadMessages({ channelId });
    }

    // Stick to the bottom on channel change
    setIsSticky(true);
  }

  // Current channel gets read automatically
  markRead({ channelId });

  const onBeforePost = () => {
    // Move view to the bottom when posting
    setIsSticky(true);
  };

  const onToggleSilence = (e) => {
    e.preventDefault();
    toggleSilence({ channelId });
  };

  let silenceTitle;
  let silenceContent;

  if (channel.metadata.isSilenced) {
    silenceTitle = 'Desilence notifications';
    silenceContent = 'desilence';
  } else {
    silenceTitle = 'Silence notifications';
    silenceContent = 'silence';
  }

  let activeUsers;
  let userList;

  if (!channel.isFeed) {
    const toggleUserList = (e) => {
      e.preventDefault();

      setIsUserListVisible(!isUserListVisible);
    };

    activeUsers = <div className='channel-user-count-container'>
      <div
        className='channel-user-count'
        title={isUserListVisible ? 'Hide user list' : 'Display user list'}
        onClick={toggleUserList}>
        <span role='img' aria-label='person'>
          👤
        </span>
        {channel.activeUsers.length}
      </div>
    </div>;

    if (isUserListVisible) {
      userList = <div className='channel-content-user-list'>
        <UserList channelName={channel.name} users={channel.activeUsers}/>
      </div>;
    }
  }

  let channelLink = `#${channel.name}`;
  if (channel.isFeed) {
    const onFeedURLClick = (e) => {
      e.preventDefault();
      displayFeedURL({ channelId: channel.id, channelName: channel.name });
    };

    channelLink = <a
      className='channel-name-link'
      href={getFeedURL(channel)}
      title='Print feed URL'
      onClick={onFeedURLClick}>
      {channelLink}
    </a>;
  } else {
    const onHelpClick = (e) => {
      e.preventDefault();
      displayHelp({ channelId: channel.id });
    };

    channelLink = <span
      className='channel-name-link'
      title='Display help'
      onClick={onHelpClick}>
      {channelLink}
    </span>;
  }

  return <div className='channel-container'>
    <header className='channel-info'>
      <div className='channel-info-container'>
        <div className='channel-name-container'>
          <div className='channel-name'>
            {channelLink}
          </div>
        </div>
        {activeUsers}
        <div className='channel-info-fill'></div>
        <div className='channel-silence-container'>
          <button
            title={silenceTitle}
            className='channel-silence button'
            onClick={onToggleSilence}>
            {silenceContent}
          </button>
        </div>
        <div className='channel-delete-container'>
          <Link
            to={`/channel/${channelId}/delete`}
            className='channel-delete button button-danger'>
            delete channel
          </Link>
        </div>
      </div>
    </header>
    <div className='channel-content-container'>
      <div className='channel-content'>
        <MessageList
          channelName={channel.name}
          readHeight={channel.readHeight}
          messages={channel.messages}
          isSticky={isSticky}
          setIsSticky={setIsSticky}/>
        {userList}
      </div>
    </div>
    <footer className='channel-compose'>
      <Compose channelId={channelId} onBeforePost={onBeforePost}/>
    </footer>
  </div>;
}

Channel.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({ id: PropTypes.string }),
  }),
  channel: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    isFeed: PropTypes.bool.isRequired,
    readHeight: PropTypes.number.isRequired,
    metadata: PropTypes.shape({
      isSilenced: PropTypes.bool,
    }),
    messages: PropTypes.arrayOf(PropTypes.object),
    activeUsers: PropTypes.arrayOf(PropTypes.object),
  }),
  markRead: PropTypes.func.isRequired,
  loadMessages: PropTypes.func.isRequired,
  toggleSilence: PropTypes.func.isRequired,
  updateReadHeight: PropTypes.func.isRequired,
  displayFeedURL: PropTypes.func.isRequired,
  displayHelp: PropTypes.func.isRequired,
};

const mapStateToProps = (state, { match }) => {
  const channelId = match.params.id;
  return {
    channel: state.channels.get(channelId),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    markRead: (...args) => dispatch(channelMarkRead(...args)),
    loadMessages: (...args) => dispatch(loadMessages(...args)),
    toggleSilence: (...args) => dispatch(toggleSilence(...args)),
    updateReadHeight: (...args) => dispatch(channelUpdateReadHeight(...args)),

    displayFeedURL: (...args) => dispatch(displayFeedURL(...args)),
    displayHelp: (...args) => dispatch(displayHelp(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Channel);
