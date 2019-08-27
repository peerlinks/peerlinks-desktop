import React, { useState } from 'react';
import { connect } from 'react-redux';

import FullScreen from '../layouts/FullScreen';

import {
  newChannel, newChannelReset,
} from '../redux/actions';

import './NewChannel.css';

function NewChannel({ newChannel, reset, state }) {
  const [ channelName, setChannelName ] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();

    newChannel({ channelName });
  };

  const form = <form className='new-channel-form' onSubmit={onSubmit}>
    <div className='form-row'>
      <h3 className='title'>New channel and identity</h3>
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
        NOTE: Identity will be created together with the channel, both
        sharing the name.
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
    newChannel: (...args) => dispatch(newChannel(...args)),
    reset: (...args) => dispatch(newChannelReset(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(NewChannel);
