import Network from './network';

const network = new Network();

//
// backend
//

export function initBackend({ passphrase }) {
  const load = async (dispatch) => {
    await network.init({ passphrase });

    const channels = await network.getChannels();
    for (const channel of channels) {
      dispatch(addChannel(channel));
    }

    const identities = await network.getIdentities();
    for (const identity of identities) {
      dispatch(addIdentity({ identity }));
    }
  };

  return (dispatch) => {
    dispatch(setBackendLoading({ loading: true }));

    load(dispatch).then(() => {
      dispatch(setBackendReady({ ready: true }));
    }).catch((error) => {
      dispatch(setBackendError({ error }));
    });
  };
}

export function setBackendReady({ ready }) {
  return { type: 'SET_BACKEND_READY', ready };
}

export function setBackendLoading({ loading }) {
  return { type: 'SET_BACKEND_LOADING', loading };
}

export function setBackendError({ error }) {
  return { type: 'SET_BACKEND_ERROR', error };
}

//
// currentChannel
//

export function setCurrentChannel({ channelId }) {
  return { type: 'SET_CURRENT_CHANNEL', channelId };
}

//
// identities
//

export function addIdentity({ identity }) {
  return { type: 'ADD_IDENTITY', identity };
}

//
// channels
//

export function addChannel(channel) {
  return { type: 'ADD_CHANNEL', channel };
}

export function appendChannelMessage({ channelId, message }) {
  return { type: 'APPEND_CHANNEL_MESSAGE', channelId, message };
}

export function trimChannelMessages({ channelId, count }) {
  return { type: 'TRIM_CHANNEL_MESSAGES', channelId, count };
}
