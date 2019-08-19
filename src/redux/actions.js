import Network from './network';

export const NETWORK_READY = 'NETWORK_READY';
export const NETWORK_LOADING = 'NETWORK_LOADING';
export const NETWORK_ERROR = 'NETWORK_ERROR';

export const NEW_CHANNEL_CREATED = 'NEW_CHANNEL_CREATED';
export const NEW_CHANNEL_RESET = 'NEW_CHANNEL_RESET';
export const NEW_CHANNEL_IN_PROGRESS = 'NEW_CHANNEL_IN_PROGRESS';
export const NEW_CHANNEL_ERROR = 'NEW_CHANNEL_ERROR';

export const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
export const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';

export const ADD_IDENTITY = 'ADD_IDENTITY';

export const ADD_CHANNEL = 'ADD_CHANNEL';
export const APPEND_CHANNEL_MESSAGE = 'APPEND_CHANNEL_MESSAGE';
export const TRIM_CHANNEL_MESSAGES = 'TRIM_MESSAGES';

const network = new Network();

//
// network
//

export function networkReady() {
  return { type: NETWORK_READY };
}

export function networkLoading() {
  return { type: NETWORK_LOADING };
}

export function networkError(error) {
  return { type: NETWORK_ERROR, error };
}

export function initNetwork({ passphrase }) {
  const init = async (dispatch) => {
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
    dispatch(networkLoading());
    init(dispatch).then(() => {
      dispatch(networkReady());
    }).catch((e) => {
      dispatch(networkError(e));
    });
  };
}

//
// new channel
//

export function newChannelCreated({ channelId }) {
  return { type: NEW_CHANNEL_CREATED, channelId };
}

export function newChannelReset() {
  return { type: NEW_CHANNEL_RESET };
}

export function newChannelInProgress() {
  return { type: NEW_CHANNEL_IN_PROGRESS };
}

export function newChannelError(error) {
  return { type: NEW_CHANNEL_ERROR, error };
}

export function newChannel({ channelName }) {
  const createChannel = async (dispatch) => {
    const { identity, channel } = await network.createIdentityPair({
      name: channelName,
    });

    dispatch(addChannel(channel));
    dispatch(addIdentity(identity));

    return channel.id;
  };

  return (dispatch) => {
    dispatch(newChannelInProgress());
    createChannel(dispatch).then((channelId) => {
      dispatch(newChannelCreated({ channelId }));
    }).catch((e) => {
      dispatch(newChannelError(e));
    });
  };
}

//
// notifications
//

export function addNotification({ kind, content }) {
  return { type: ADD_NOTIFICATION, kind, content };
}

export function removeNotification({ notificationId }) {
  return { type: REMOVE_NOTIFICATION, notificationId };
}

//
// identities
//

export function addIdentity(identity) {
  return { type: ADD_IDENTITY, identity };
}

//
// channels
//

export function addChannel(channel) {
  return (dispatch) => {
    dispatch({ type: ADD_CHANNEL, channel });

    const loop = () => {
      network.waitForIncomingMessage({ channelId: channel.id }).then(() => {
        dispatch(loadMessages({ channelId: channel.id }));
        loop();
      }).catch((e) => {
        dispatch(addNotification({
          kind: 'error',
          content: 'Failed to wait for an update: ' + e.message,
        }));
      });
    };
    loop();
  };
}

export function appendChannelMessage({ channelId, message }) {
  return { type: APPEND_CHANNEL_MESSAGE, channelId, message };
}

export function trimChannelMessages({ channelId, count }) {
  return { type: TRIM_CHANNEL_MESSAGES, channelId, count };
}

export const DEFAULT_LOAD_LIMIT = 1024;

export function loadMessages(options) {
  const { channelId, offset = 0, limit = DEFAULT_LOAD_LIMIT } = options;
  const load = async (dispatch) => {
    const messages = await network.getReverseMessagesAtOffset({
      channelId,
      offset,
      limit,
    });

    for (const message of messages) {
      dispatch(appendChannelMessage({ channelId, message }));
    }
  };

  return (dispatch) => {
    load(dispatch).catch((e) => {
      dispatch(addNotification({
        kind: 'error',
        content: 'Failed to load messages: ' + e.message,
      }));
    });
  };
}

export function postMessage({ channelId, identityKey, json }) {
  const post = async (dispatch) => {
    const message = await network.postMessage({
      channelId,
      identityKey,
      json,
    });

    dispatch(appendChannelMessage({ channelId, message }));
  };

  return (dispatch) => {
    post(dispatch).catch((e) => {
      dispatch(addNotification({
        kind: 'error',
        content: 'Failed to post message: ' + e.message,
      }));
    });
  };
}
