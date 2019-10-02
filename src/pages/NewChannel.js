import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import FullScreen from '../layouts/FullScreen';

import {
  createChannel,
} from '../redux/actions';

import './NewChannel.css';

function NewChannel ({ isFeed, createChannel, state, network }) {
  const [ channelName, setChannelName ] = useState('');

  const isValid = /^[^\s#@]+$/.test(channelName);
  const disabled = !isValid || state.isLoading;

  const onSubmit = (e) => {
    e.preventDefault();

    if (disabled) {
      return;
    }

    createChannel({ channelName, isFeed });
  };
  console.log(network);

  let title;
  let placeholder;
  if (isFeed) {
    title = 'New feed and identity';
    placeholder = 'Feed name';
  } else if (network.isFirstRun) {
    title = 'New identity';
    placeholder = 'Identity name';
  } else {
    title = 'New channel and identity';
    placeholder = 'Channel name';
  }

  const form = <form className='new-channel-form' onSubmit={onSubmit}>
    <div className='form-row'>
      <h3 className='title'>{title}</h3>
    </div>
    <div className='form-row'>
      <input
        className='new-channel-name form-input'
        type='text'
        disabled={state.isLoading}
        placeholder={placeholder}
        required
        value={channelName}
        onChange={(e) => setChannelName(e.target.value)}/>
    </div>
    <div className='form-row'>
      <input
        type='submit'
        disabled={disabled}
        className='button new-channel-submit'
        value='Create'/>
    </div>
    <div className='form-row new-channel-note'>
      <i>
        NOTE: Same-named operator identity will be created together with
        the {isFeed ? 'feed' : 'channel'}.
      </i>
    </div>
  </form>;

  return <FullScreen>
    <div className='new-channel-page'>
      {form}
    </div>
  </FullScreen>;
}

NewChannel.propTypes = {
  isFeed: PropTypes.bool.isRequired,
  createChannel: PropTypes.func.isRequired,
  state: PropTypes.shape({ isLoading: PropTypes.bool }),
  network: PropTypes.shape({ isFirstRun: PropTypes.bool }),
};

const mapStateToProps = (state) => {
  return {
    network: state.network,
    state: state.newChannel,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    createChannel: (...args) => dispatch(createChannel(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(NewChannel);
