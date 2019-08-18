import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { newChannel, newChannelReset } from '../redux/actions';

import FullScreen from '../layouts/FullScreen';

import './NewChannel.css';

function NewChannel({ newChannel, newChannelReset, state }) {
  const [ channelName, setChannelName ] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();

    newChannel({ channelName });
  };

  let redirect;
  if (state.created) {
    redirect = `/channel/${state.created.channelId}`;
    newChannelReset();
  }

  return <FullScreen>
    {state.error && <p className='error'>{state.error.message}</p>}
    {redirect && <Redirect to={redirect}/>}
    <form className='new-channel' onSubmit={onSubmit}>
      <div className='new-channel-row'>
        <h3 className='title'>New channel</h3>
      </div>
      <div className='new-channel-row'>
        <input
          className='new-channel-name'
          type='text'
          disabled={state.isLoading}
          placeholder='Channel name'
          required
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}/>
      </div>
      <div className='new-channel-row'>
        <input
          type='submit'
          disabled={state.isLoading}
          className='button'
          value='Create'/>
      </div>
    </form>
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
    newChannelReset: (...args) => dispatch(newChannelReset(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(NewChannel);
