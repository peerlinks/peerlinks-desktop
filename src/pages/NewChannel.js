import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import network from '../network';
import { addChannel, addIdentity } from '../redux/actions';

import FullScreen from '../layouts/FullScreen';

import './NewChannel.css';

function NewChannel({ addChannel, addIdentity }) {
  const [ loading, setLoading ] = useState(false);
  const [ error, setError ] = useState(null);
  const [ redirect, setRedirect ] = useState(false);

  const [ channelName, setChannelName ] = useState('');

  const createChannel = async () => {
    const { identity, channel } = await network.createIdentityPair({
      name: channelName,
    });

    addChannel(channel);
    addIdentity(identity);

    return channel;
  };

  const onSubmit = (e) => {
    e.preventDefault();

    setLoading(true);
    createChannel().then((channel) => {
      setRedirect(`/channel/${channel.id}`);
    }).catch((e) => {
      setError(e);
    }).finally(() => {
      setLoading(false);
    });

    setChannelName('');
  };

  return <FullScreen>
    {error && <p className='error'>{error.message}</p>}
    {redirect && <Redirect to={redirect}/>}
    <form className='new-channel' onSubmit={onSubmit}>
      <div className='new-channel-row'>
        <h3 className='title'>New channel</h3>
      </div>
      <div className='new-channel-row'>
        <input
          className='new-channel-name'
          type='text'
          disabled={loading}
          placeholder='Channel name'
          required
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}/>
      </div>
      <div className='new-channel-row'>
        <input
          type='submit'
          disabled={loading}
          className='button'
          value='Create'/>
      </div>
    </form>
  </FullScreen>;
}

const mapStateToProps = (state) => {
  return {};
};

const mapDispatchToProps = (dispatch) => {
  return {
    addChannel: (channel) => dispatch(addChannel(channel)),
    addIdentity: (channel) => dispatch(addIdentity(channel)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(NewChannel);
