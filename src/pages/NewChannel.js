import React, { useState } from 'react';
import { connect } from 'react-redux';

import { createChannel } from '../redux/actions';

import FullScreen from '../layouts/FullScreen';

import './NewChannel.css';

function NewChannel({ createChannel }) {
  const [ channelName, setChannelName ] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    createChannel({ name: channelName });

    setChannelName('');
  };

  return <FullScreen>
    <form className='new-channel' onSubmit={onSubmit}>
      <div className='new-channel-row'>
        <h3 className='title'>New channel</h3>
      </div>
      <div className='new-channel-row'>
        <input
          className='new-channel-name'
          type='text'
          placeholder='Channel name'
          required
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}/>
      </div>
      <div className='new-channel-row'>
        <input type='submit' className='button' value='Create'/>
      </div>
    </form>
  </FullScreen>;
}

const mapStateToProps = () => {
  return {};
};

const mapDispatchToProps = (dispatch) => {
  return {
    createChannel({ name }) {
      dispatch(createChannel({ name }));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(NewChannel);
