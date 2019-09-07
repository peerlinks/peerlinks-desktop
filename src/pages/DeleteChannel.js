import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import FullScreen from '../layouts/FullScreen';

import { removeIdentityPair } from '../redux/actions';

import './DeleteChannel.css';

const DeleteChannel = withRouter((props) => {
  const { match, channels, removeIdentityPair, history } = props;
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

  const onBack = (e) => {
    history.push(`/channel/${channel.id}/`);
  };

  return <FullScreen>
    <div className='delete-channel'>
      <div className='delete-channel-row'>
        <h3 className='title'>Are you sure you want to delete?</h3>
      </div>
      <div className='delete-channel-row delete-channel-name'>
        <span className='channel-name'>#{channel.name}</span>
      </div>

      <div className='delete-channel-row'>
        <button
          className='button button-danger delete-button'
          onClick={onDelete}>
          Delete
        </button>
        <button
          className='button take-back-button'
          onClick={onBack}>
          Take me back!
        </button>
      </div>

      <div className='delete-channel-row'>
        <i>NOTE: This will also remove same-named identity.</i>
      </div>
    </div>
  </FullScreen>;
});

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
