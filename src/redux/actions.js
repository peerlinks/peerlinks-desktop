import Network from './network';

const network = new Network();

const wrapPromise = (target, promise, dispatch) => {
  dispatch(setLoaderLoading({ target, loading: true }));
  promise.then(() => {
    dispatch(setLoaderReady({ target, ready: true }));
  }).catch((error) => {
    dispatch(setLoaderError({ target, error }));
  });
};

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
    wrapPromise('backend', load(dispatch), dispatch);
  };
}

export function setLoaderReady({ target, ready }) {
  return { type: 'SET_LOADER_READY', target, ready };
}

export function setLoaderLoading({ target, loading }) {
  return { type: 'SET_LOADER_LOADING', target, loading };
}

export function setLoaderError({ target, error }) {
  return { type: 'SET_LOADER_ERROR', target, error };
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
    wrapPromise('newChannel', load(dispatch), dispatch);
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
