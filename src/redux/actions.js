import Network from './network';
import COMMANDS from './commands';

export const SET_REDIRECT = 'SET_REDIRECT';

export const NETWORK_READY = 'NETWORK_READY';
export const NETWORK_NOT_READY = 'NETWORK_NOT_READY';
export const NETWORK_LOADING = 'NETWORK_LOADING';
export const NETWORK_ERROR = 'NETWORK_ERROR';

export const NEW_CHANNEL_RESET = 'NEW_CHANNEL_RESET';
export const NEW_CHANNEL_IN_PROGRESS = 'NEW_CHANNEL_IN_PROGRESS';
export const NEW_CHANNEL_ERROR = 'NEW_CHANNEL_ERROR';

export const INVITE_REQUEST_GENERATING = 'INVITE_REQUEST_GENERATING';
export const INVITE_REQUEST_WAITING = 'INVITE_REQUEST_WAITING';
export const INVITE_REQUEST_SET_IDENTITY_KEY =
  'INVITE_REQUEST_SET_IDENTITY_KEY';
export const INVITE_REQUEST_SET_REQUEST = 'INVITE_REQUEST_SET_REQUEST';
export const INVITE_REQUEST_RESET = 'INVITE_REQUEST_RESET';

export const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
export const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';

export const ADD_IDENTITY = 'ADD_IDENTITY';
export const REMOVE_IDENTITY = 'REMOVE_IDENTITY';
export const IDENTITY_ADD_CHANNEL = 'IDENTITY_ADD_CHANNEL';

export const ADD_CHANNEL = 'ADD_CHANNEL';
export const REMOVE_CHANNEL = 'REMOVE_CHANNEL';
export const APPEND_CHANNEL_MESSAGE = 'APPEND_CHANNEL_MESSAGE';
export const APPEND_CHANNEL_MESSAGES = 'APPEND_CHANNEL_MESSAGES';
export const TRIM_CHANNEL_MESSAGES = 'TRIM_MESSAGES';
export const CHANNEL_SET_MESSAGE_COUNT = 'CHANNEL_SET_MESSAGE_COUNT';
export const CHANNEL_UPDATE_METADATA = 'CHANNEL_UPDATE_METADATA';

const network = new Network();

export function setRedirect(to) {
  return { type: SET_REDIRECT, to };
}

//
// network
//

export function networkReady() {
  return { type: NETWORK_READY };
}

export function networkNotReady() {
  return { type: NETWORK_NOT_READY };
}

export function networkLoading() {
  return { type: NETWORK_LOADING };
}

export function networkError(error) {
  return { type: NETWORK_ERROR, error };
}

async function setInitialPage(dispatch, getState) {
  const { channels } = getState();

  // Select first channel if any are available
  if (channels.size === 0) {
    dispatch(setRedirect('/new-channel'));
  } else {
    dispatch(setRedirect(`/channel/${channels.values().next().value.id}/`));
  }
}

// Not really an action, but a helper
async function loadNetwork(dispatch, getState) {
  const channels = await network.getChannels();
  for (const channel of channels) {
    dispatch(addChannel(channel));
  }

  const identities = await network.getIdentities();
  for (const identity of identities) {
    dispatch(addIdentity(identity));
  }

  dispatch(networkReady());
  setInitialPage(dispatch, getState);
}

export function checkNetwork() {
  const check = async (dispatch, getState) => {
    const isReady = await network.isReady();

    if (!isReady) {
      dispatch(networkNotReady());
      return;
    }

    await loadNetwork(dispatch, getState);
  };

  return (dispatch, getState) => {
    dispatch(networkLoading());
    check(dispatch, getState).catch((e) => {
      dispatch(networkError(e));
    });
  };
}

export function initNetwork({ passphrase }) {
  const init = async (dispatch, getState) => {
    await network.init({ passphrase });
    await loadNetwork(dispatch, getState);
  };

  return (dispatch, getState) => {
    dispatch(networkLoading());
    init(dispatch, getState).catch((e) => {
      dispatch(networkError(e));
    });
  };
}

//
// new channel
//

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
    dispatch(newChannelReset());
    dispatch(setRedirect(`/channel/${channel.id}/`));
  };

  return (dispatch) => {
    dispatch(newChannelInProgress());
    createChannel(dispatch).catch((e) => {
      dispatch(newChannelError(e));
    });
  };
}

export function requestInvite({ identityKey }) {
  const generate = async (dispatch) => {
    return await network.requestInvite({ identityKey });
  };

  return (dispatch) => {
    dispatch({ type: INVITE_REQUEST_GENERATING });
    generate(dispatch).then((request) => {
      dispatch({
        type: INVITE_REQUEST_SET_REQUEST,
        identityKey,
        request,
      });
    }).catch((e) => {
      dispatch(newChannelError(e));
    });
  };
}

export function waitForInvite({ identityKey }) {
  const wait = async (dispatch) => {
    return await network.waitForInvite({ identityKey });
  };

  return (dispatch) => {
    dispatch({ type: INVITE_REQUEST_WAITING });
    wait(dispatch).then((channel) => {
      // Allow posting to this channel
      dispatch({
        type: IDENTITY_ADD_CHANNEL,
        identityKey,
        channelId: channel.id,
      });
      dispatch(addChannel(channel));
      dispatch(inviteRequestReset());
      dispatch(setRedirect(`/channel/${channel.id}/`));
    }).catch((e) => {
      dispatch(newChannelError(e));
    });
  };
}

export function inviteRequestReset() {
  return { type: INVITE_REQUEST_RESET };
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

export function removeIdentity({ identityKey }) {
  return { type: REMOVE_IDENTITY, identityKey };
}

//
// channels
//

// Small delay to prevent spins
const UPDATE_ONCE = 150;

export function addChannel(channel) {
  const channelId = channel.id;

  return (dispatch) => {
    dispatch({ type: ADD_CHANNEL, channel });

    const runUpdate = () => {
      dispatch(updateMessageCount({ channelId }));
      dispatch(loadMessages({ channelId }));
    };

    // Coalesce updates
    let timer;
    const update = () => {
      if (timer) {
        return;
      }

      timer = setTimeout(() => {
        timer = null;
        runUpdate();
      }, UPDATE_ONCE);
    };

    const loop = () => {
      network.waitForIncomingMessage({ channelId }).then(() => {
        update();

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

export function removeChannel({ channelId }) {
  return { type: REMOVE_CHANNEL, channelId };
}

export function removeIdentityPair({ channelId, identityKey }) {
  const remove = async (dispatch, getState) => {
    await network.removeIdentityPair({ channelId, identityKey });

    dispatch(removeChannel({ channelId }));
    dispatch(removeIdentity({ identityKey }));
    setInitialPage(dispatch, getState);
  };

  return (dispatch, getState) => {
    remove(dispatch, getState).catch((e) => {
      dispatch(addNotification({
        kind: 'error',
        content: 'Failed to remove channel: ' + e.message,
      }));
    });
  };
}

export function updateChannelMetadata({ channelId, metadata }) {
  const update = async (dispatch) => {
    await network.updateChannelMetadata({ channelId, metadata });

    dispatch({ type: CHANNEL_UPDATE_METADATA, channelId, metadata });
  };

  return (dispatch) => {
    update(dispatch).catch((e) => {
      dispatch(addNotification({
        kind: 'error',
        content: 'Failed to update channel metadata: ' + e.message,
      }));
    });
  };
}

export function appendChannelMessage({ channelId, message, isPosted = false }) {
  return { type: APPEND_CHANNEL_MESSAGE, channelId, message, isPosted };
}

export function appendChannelMessages({ channelId, messages }) {
  return { type: APPEND_CHANNEL_MESSAGES, channelId, messages };
}

export function trimChannelMessages({ channelId, count }) {
  return { type: TRIM_CHANNEL_MESSAGES, channelId, count };
}

export function updateMessageCount({ channelId }) {
  const update = async (dispatch) => {
    const messageCount = await network.getMessageCount({ channelId });
    dispatch({ type: CHANNEL_SET_MESSAGE_COUNT, channelId, messageCount });
  };

  return (dispatch) => {
    update(dispatch).catch((e) => {
      dispatch(addNotification({
        kind: 'error',
        content: 'Failed to update message count: ' + e.message,
      }));
    });
  };
}

export function channelMarkRead({ channelId }) {
  return (dispatch, getState) => {
    const channel = getState().channels.get(channelId);
    if (!channel) {
      return;
    }

    // No update needed
    if (channel.metadata.readCount >= channel.messageCount) {
      return;
    }

    const metadata = Object.assign({}, channel.metadata, {
      readCount: channel.messageCount,
    });

    dispatch(updateChannelMetadata({ channelId, metadata }));
  };
}

export const DEFAULT_LOAD_LIMIT = 256;

export function loadMessages(options) {
  const { channelId, offset = 0, limit = DEFAULT_LOAD_LIMIT } = options;
  const load = async (dispatch) => {
    const messages = await network.getReverseMessagesAtOffset({
      channelId,
      offset,
      limit,
    });

    dispatch(appendChannelMessages({ channelId, messages }));

    // TODO(indutny): scroll back
    dispatch(trimChannelMessages({ channelId, count: DEFAULT_LOAD_LIMIT }));
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

export function invite(params) {
  const run = async (dispatch) => {
    return await network.invite(params);
  };

  return (dispatch) => {
    run(dispatch).then((success) => {
      if (!success) {
        return dispatch(addNotification({
          kind: 'error',
          content: `"${params.inviteeName}" did not accept the invite`,
        }));
      }

      dispatch(addNotification({
        kind: 'info',
        content: `Invited "${params.inviteeName}" to the channel`,
      }));
    }).catch((e) => {
      dispatch(addNotification({
        kind: 'error',
        content: `Failed to invite "${params.inviteeName}": ` + e.message,
      }));
    });
  };
}

export function postMessage({ channelId, identityKey, text }) {
  // Execute commands
  async function runCommand(dispatch, { channelId, identityKey, text }) {
    const parts = text.trim().split(/\s+/g);

    const commandName = parts.shift().slice(1);
    const args = parts;

    if (!COMMANDS.has(commandName)) {
      throw new Error(`Unknown command: /${commandName}`);
    }

    const command = COMMANDS.get(commandName);
    if (command.args.length !== args.length) {
      throw new Error('Invalid command arguments. ' +
        `Expected: /${commandName} ${command.args.join(' ')}`);
    }

    const params = Object.create(null);
    params.channelId = channelId;
    params.identityKey = identityKey;
    for (const [ i, arg ] of args.entries()) {
      params[command.args[i]] = arg;
    }

    dispatch(command.action(params));
  }

  const post = async (dispatch) => {
    if (text.startsWith('/')) {
      return await runCommand(dispatch, { channelId, identityKey, text });
    }

    const message = await network.postMessage({
      channelId,
      identityKey,
      json: { text },
    });

    dispatch(appendChannelMessage({ channelId, message, isPosted: true }));
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
