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
      dispatch(addIdentity(identity));
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
// identities
//

export function addIdentity(identity) {
  return { type: 'ADD_IDENTITY', identity };
}

//
// channels
//

export function createChannel({ name }) {
  const load = async (dispatch) => {
    const { identity, channel } = await network.createIdentityPair({ name });

    dispatch(addChannel(channel));
    dispatch(addIdentity(identity));
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
export function addChannel(channel) {
  return { type: 'ADD_CHANNEL', channel };
}

export function appendChannelMessage({ channelId, message }) {
  return { type: 'APPEND_CHANNEL_MESSAGE', channelId, message };
}

export function trimChannelMessages({ channelId, count }) {
  return { type: 'TRIM_CHANNEL_MESSAGES', channelId, count };
}
