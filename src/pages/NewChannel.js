import React, { useState } from 'react';
import { connect } from 'react-redux';

import FullScreen from '../layouts/FullScreen';

import {
  createChannel, newChannelReset,
} from '../redux/actions';

import './NewChannel.css';

function NewChannel({ isFeed, createChannel, reset, state }) {
  const [ channelName, setChannelName ] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();

    createChannel({ channelName, isFeed });
  };

  const form = <form className='new-channel-form' onSubmit={onSubmit}>
    <div className='form-row'>
      <h3 className='title'>New {isFeed ? 'feed' : 'channel'} and identity</h3>
    </div>
    <div className='form-row'>
      <input
        className='new-channel-name form-input'
        type='text'
        disabled={state.isLoading}
        placeholder='Channel name'
        required
        value={channelName}
        onChange={(e) => setChannelName(e.target.value)}/>
    </div>
    <div className='form-row'>
      <input
        type='submit'
        disabled={state.isLoading}
        className='button new-channel-submit'
        value='Create'/>
    </div>
    <div className='form-row new-channel-note'>
      <i>
        NOTE: Same-named operator identity will be created together with the
        &nbsp;
        {isFeed ? 'feed' : 'channel'}.
      </i>
    </div>
  </form>;

  return <FullScreen>
    <div className='new-channel-page'>
      {form}
    </div>
  </FullScreen>;
}

const mapStateToProps = (state) => {
  return {
    state: state.newChannel,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    createChannel: (...args) => dispatch(createChannel(...args)),
    reset: (...args) => dispatch(newChannelReset(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(NewChannel);
