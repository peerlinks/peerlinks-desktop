import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import FullScreen from '../layouts/FullScreen';

import { removeIdentityPair } from '../redux/actions';

import './DeleteChannel.css';

function DeleteChannel({ match, channels, removeIdentityPair }) {
  const channel = channels.get(match.params.id);
  if (!channel) {
    return null;
  }

  const onDelete = (e) => {
    e.preventDefault();
    removeIdentityPair({
      channelId: channel.id,
      identityKey: channel.publicKey,
    });
  };

  return <FullScreen>
    <div className='delete-channel'>
      <div className='delete-channel-row'>
        <h3 className='title'>Are you sure you want to delete?</h3>
        <h2 className='channel-name'>#{channel.name}</h2>
      </div>

      <div className='delete-channel-row'>
        <button
          className='button button-danger delete-button'
          onClick={onDelete}>
          Delete
        </button>
        <Link
          className='button take-back-button'
          to={`/channel/${channel.id}/`}>
          Take me back!
        </Link>
      </div>

      <div className='delete-channel-row'>
        <i>NOTE: This will also remove same-named identity.</i>
      </div>
    </div>
  </FullScreen>;
}

const mapStateToProps = (state) => {
  return {
    channels: state.channels,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    removeIdentityPair: (...args) => dispatch(removeIdentityPair(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DeleteChannel);
