import { getFeedURL } from '../utils';

import Network from './network';
import COMMANDS from './commands';

export const SET_REDIRECT = 'SET_REDIRECT';
export const SET_FOCUS = 'SET_FOCUS';

export const NETWORK_READY = 'NETWORK_READY';
export const NETWORK_NOT_READY = 'NETWORK_NOT_READY';
export const NETWORK_LOADING = 'NETWORK_LOADING';
export const NETWORK_ERROR = 'NETWORK_ERROR';

export const NEW_CHANNEL_RESET = 'NEW_CHANNEL_RESET';
export const NEW_CHANNEL_SET_IS_LOADING = 'NEW_CHANNEL_SET_IS_LOADING';

export const INVITE_REQUEST_GENERATING = 'INVITE_REQUEST_GENERATING';
export const INVITE_REQUEST_WAITING = 'INVITE_REQUEST_WAITING';
export const INVITE_REQUEST_SET_REQUEST = 'INVITE_REQUEST_SET_REQUEST';
export const INVITE_REQUEST_RESET = 'INVITE_REQUEST_RESET';

export const COMPOSE_UPDATE_IDENTITY_KEY = 'COMPOSE_UPDATE_IDENTITY_KEY';
export const COMPOSE_UPDATE_MESSAGE = 'COMPOSE_UPDATE_MESSAGE';
export const COMPOSE_CHANGE_MESSAGE = 'COMPOSE_CHANGE_MESSAGE';
export const COMPOSE_ADD_MESSAGE = 'COMPOSE_ADD_MESSAGE';

export const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
export const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';

export const ADD_IDENTITY = 'ADD_IDENTITY';
export const REMOVE_IDENTITY = 'REMOVE_IDENTITY';
export const IDENTITY_ADD_CHANNEL = 'IDENTITY_ADD_CHANNEL';

export const ADD_CHANNEL = 'ADD_CHANNEL';
export const REMOVE_CHANNEL = 'REMOVE_CHANNEL';
export const RENAME_IDENTITY_PAIR = 'RENAME_IDENTITY_PAIR';
export const APPEND_CHANNEL_MESSAGE = 'APPEND_CHANNEL_MESSAGE';
export const APPEND_CHANNEL_MESSAGES = 'APPEND_CHANNEL_MESSAGES';
export const TRIM_CHANNEL_MESSAGES = 'TRIM_MESSAGES';
export const CHANNEL_SET_MESSAGE_COUNT = 'CHANNEL_SET_MESSAGE_COUNT';
export const CHANNEL_UPDATE_METADATA = 'CHANNEL_UPDATE_METADATA';
export const CHANNEL_UPDATE_READ_HEIGHT = 'CHANNEL_UPDATE_READ_HEIGHT';
export const CHANNEL_SET_CHAIN_MAP = 'CHANNEL_SET_CHAIN_MAP';

const network = new Network();

export function setRedirect(to) {
  return { type: SET_REDIRECT, to };
}

export function setFocus(focus) {
  return { type: SET_FOCUS, focus };
}

//
// network
//

export function networkReady({ peerId, isFirstRun }) {
  return { type: NETWORK_READY, peerId, isFirstRun };
}

export function networkNotReady({ isFirstRun }) {
  return { type: NETWORK_NOT_READY, isFirstRun };
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

async function runChainMapLoop(dispatch) {
  for (;;) {
    const map = await network.computeChainMap();
    dispatch({ type: CHANNEL_SET_CHAIN_MAP, map });
    await network.waitForChainMapUpdate();
  }
}

// Not really an action, but a helper
async function loadNetwork(dispatch, getState, { peerId, isFirstRun }) {
  const channels = await network.getChannels();
  for (const channel of channels) {
    dispatch(addChannel(channel));
  }

  const identities = await network.getIdentities();
  for (const identity of identities) {
    dispatch(addIdentity(identity));
  }

  dispatch(networkReady({ peerId, isFirstRun }));
  setInitialPage(dispatch, getState);

  runChainMapLoop(dispatch).catch((e) => {
    dispatch(addNotification({
      kind: 'error',
      content: 'Failed to wait for an chain map: ' + e.message,
    }));
  });
}

export function checkNetwork() {
  const check = async (dispatch, getState) => {
    const { isReady, isFirstRun, peerId } = await network.getStatus();

    if (!isReady) {
      dispatch(networkNotReady({ isFirstRun }));
      return;
    }

    await loadNetwork(dispatch, getState, { peerId, isFirstRun });
  };

  return (dispatch, getState) => {
    dispatch(networkLoading());
    check(dispatch, getState).catch((e) => {
      dispatch(networkError(e.message));
    });
  };
}

export function initNetwork({ passphrase }) {
  const init = async (dispatch, getState) => {
    const { peerId } = await network.init({ passphrase });
    await loadNetwork(dispatch, getState, { peerId });
  };

  return (dispatch, getState) => {
    dispatch(networkLoading());
    init(dispatch, getState).catch((e) => {
      dispatch(networkError(e.message));
    });
  };
}

export function eraseNetwork() {
  const init = async (dispatch) => {
    await network.erase();
    dispatch(checkNetwork());
  };

  return (dispatch, getState) => {
    dispatch(networkLoading());
    init(dispatch, getState).catch((e) => {
      dispatch(networkError(e.message));
    });
  };
}

//
// new channel
//

export function newChannelReset() {
  return { type: NEW_CHANNEL_RESET };
}

export function newChannelSetIsLoading(isLoading) {
  return { type: NEW_CHANNEL_SET_IS_LOADING, isLoading };
}

export function createChannel({ channelName, isFeed }) {
  const createChannel = async (dispatch) => {
    const { identity, channel } = await network.createIdentityPair({
      name: channelName,
      isFeed,
    });

    dispatch(addChannel(channel));
    dispatch(addIdentity(identity));
    dispatch(newChannelReset());
    dispatch(setRedirect(`/channel/${channel.id}/`));
  };

  return (dispatch) => {
    dispatch(newChannelSetIsLoading(true));
    createChannel(dispatch).catch((e) => {
      dispatch(addNotification({
        kind: 'error',
        content: 'Failed to create new channel: ' + e.message,
      }));
    }).finally(() => {
      dispatch(newChannelSetIsLoading(false));
    });
  };
}

export function importFeed({ publicKey, channelName }) {
  const importFeed = async (dispatch) => {
    const channel = await network.feedFromPublicKey({
      publicKey,
      name: channelName,
    });

    dispatch(addChannel(channel));
    dispatch(setRedirect(`/channel/${channel.id}/`));
  };

  return (dispatch) => {
    importFeed(dispatch).catch((e) => {
      dispatch(addNotification({
        kind: 'error',
        content: 'Failed to add new feed: ' + e.message,
      }));
    });
  };
}

export function requestInvite({ identityKey }) {
  const generate = async () => {
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
      dispatch(waitForInvite({ identityKey }));
    }).catch((e) => {
      dispatch(addNotification({
        kind: 'error',
        content: 'Failed to generate invite code: ' + e.message,
      }));
    });
  };
}

export function waitForInvite({ identityKey }) {
  const wait = async () => {
    return await network.waitForInvite({ identityKey });
  };

  return (dispatch) => {
    wait(dispatch).then((channel) => {
      // Already waiting
      if (!channel) {
        return;
      }

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
      dispatch(addNotification({
        kind: 'error',
        content: 'Failed to wait for invite: ' + e.message,
      }));
    });
  };
}

export function inviteRequestReset() {
  return { type: INVITE_REQUEST_RESET };
}

export function updateComposeIdentity({ channelId, identityKey }) {
  return {
    type: COMPOSE_UPDATE_IDENTITY_KEY,
    channelId,
    identityKey,
  };
}

export function updateComposeMessage({ channelId, message }) {
  return {
    type: COMPOSE_UPDATE_MESSAGE,
    channelId,
    message,
  };
}

export function changeComposeMessage({ channelId, isNext }) {
  return {
    type: COMPOSE_CHANGE_MESSAGE,
    channelId,
    isNext,
  };
}

export function addComposeMessage({ channelId }) {
  return { type: COMPOSE_ADD_MESSAGE, channelId };
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

export function removeIdentity({ identity }) {
  return { type: REMOVE_IDENTITY, identity };
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
      network.waitForIncomingMessage({ channelId }).then((isAlive) => {
        // End the loop
        if (!isAlive) {
          return;
        }

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

    const identity = getState().identities.get(identityKey);

    dispatch(removeChannel({ channelId }));
    if (identity) {
      dispatch(removeIdentity({ identity }));
    }
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
    dispatch({ type: CHANNEL_UPDATE_METADATA, channelId, metadata });

    await network.updateChannelMetadata({ channelId, metadata });
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

export function appendInternalMessage({ channelId, text }) {
  return (dispatch, getState) => {
    const channel = getState().channels.get(channelId);
    if (!channel) {
      return;
    }

    // Don't break `loadMessages()` call
    if (channel.messages.length === 0) {
      return;
    }

    // NOTE: Start with `z` to put message below the last one of this height
    const hash = `z:internal:${Date.now()}`;
    const height = channel.messages.reduce((height, message) => {
      return Math.max(height, message.height);
    }, 0);

    dispatch(appendChannelMessage({
      channelId,
      message: {
        hash,
        height,

        author: {
          isInternal: true,
          displayPath: [ '@peerlinks' ],
          publicKeys: [ '@peerlinks' ],
        },
        timestamp: Date.now() / 1000,
        json: { text },
      },
    }));
  };
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
    const { focus, channels } = getState();
    if (!focus) {
      return;
    }

    const channel = channels.get(channelId);
    if (!channel) {
      return;
    }

    // No update needed
    if (channel.metadata.readCount >= channel.messageCount) {
      return;
    }

    const metadata = {
      readCount: channel.messageCount,
    };

    dispatch(updateChannelMetadata({ channelId, metadata }));
  };
}

export function channelUpdateReadHeight({ channelId }) {
  return { type: CHANNEL_UPDATE_READ_HEIGHT, channelId };
}

export function toggleSilence({ channelId }) {
  return (dispatch, getState) => {
    const channel = getState().channels.get(channelId);
    if (!channel) {
      return;
    }

    const metadata = {
      isSilenced: !channel.metadata.isSilenced,
    };

    dispatch(updateChannelMetadata({ channelId, metadata }));
  };
}

// Helper, not action
function displayNotifications(dispatch, { filter, channel, messages }) {
  // NOTE: We track the notification height instead of just last height, because
  // we want to give mentions from the merged branches more chances to become
  // visible.
  let lastNotificationHeight = channel.metadata.lastNotificationHeight || 0;

  for (const message of messages) {
    if (message.height <= lastNotificationHeight) {
      continue;
    }

    if (!message.json || !message.json.text) {
      continue;
    }

    // Has to mention us
    // TODO(indutny): filter out self-mentions
    if (!filter.test(message.json.text)) {
      continue;
    }

    // Update last notification height right before displaying the notification
    lastNotificationHeight = message.height;

    const displayPath = message.author.displayPath;
    let author;
    if (displayPath.length === 0) {
      author = 'Channel owner';
    } else {
      author = `"${displayPath[displayPath.length - 1]}"`;
    }

    if (channel.metadata.isSilenced) {
      continue;
    }

    const notification = new Notification(`${author} in #${channel.name}`, {
      body: `${message.json.text}`,
    });

    // Open the channel page on click
    // TODO(indutny): scroll to the message?
    notification.addEventListener('click', () => {
      dispatch(setRedirect(`/channel/${channel.id}/`));
    });
  }

  if (channel.metadata.lastNotificationHeight !== lastNotificationHeight) {
    const metadata = { lastNotificationHeight };
    dispatch(updateChannelMetadata({ channelId: channel.id, metadata }));
  }
}

export const DEFAULT_LOAD_LIMIT = 1024;

export function loadMessages(options) {
  const { channelId, offset = 0, limit = DEFAULT_LOAD_LIMIT } = options;

  const load = async (dispatch, getState) => {
    const state = getState();
    const channel = state.channels.get(channelId);
    if (!channel) {
      return;
    }

    const messages = await network.getReverseMessagesAtOffset({
      channelId,
      offset,
      limit,
    });

    const filter = state.identityFilter.filter;
    displayNotifications(dispatch, { filter, channel, messages });

    dispatch(appendChannelMessages({ channelId, messages }));

    // TODO(indutny): allow scroll back in UI
    dispatch(trimChannelMessages({ channelId, count: DEFAULT_LOAD_LIMIT }));
  };

  return (dispatch, getState) => {
    load(dispatch, getState).catch((e) => {
      dispatch(addNotification({
        kind: 'error',
        content: 'Failed to load messages: ' + e.message,
      }));
    });
  };
}

const INVITE_FALLBACK_DELAY = 5 * 1000;

// NOTE: Command
export function invite(params) {
  const run = async (dispatch) => {
    const { encryptedInvite, peerId } = await network.invite(params);

    const post = (text) => {
      dispatch(appendInternalMessage({
        channelId: params.channelId,
        text,
      }));
    };

    post('(Sending invite...)');

    const delay = setTimeout(() => {
      post('It took unusually long to send an invite...');
      post(
        'As a fallback - consider asking your peer to run following command ' +
        'in any channel:');
      post(`\`/accept-invite ${encryptedInvite.requestId} ` +
            `${encryptedInvite.box}\``);
    }, INVITE_FALLBACK_DELAY);

    const isSuccess = await network.sendInvite({ encryptedInvite, peerId });
    clearTimeout(delay);
    return isSuccess;
  };

  return (dispatch) => {
    run(dispatch).then((success) => {
      if (!success) {
        new Notification(params.inviteeName, {
          body: 'Did not accept the invite to the channel',
        });
        return;
      }

      new Notification(params.inviteeName, {
        body: 'Has received the invite to the channel',
      });
    }).catch((e) => {
      dispatch(addNotification({
        kind: 'error',
        content: `Failed to invite "${params.inviteeName}": ` + e.message,
      }));
    });
  };
}

// NOTE: Command
export function acceptInvite(params) {
  const run = async () => {
    return await network.acceptInvite(params);
  };

  return (dispatch) => {
    run(dispatch).then((success) => {
      if (!success) {
        throw new Error('Was not waiting for an invite...');
      }
    }).catch((e) => {
      dispatch(addNotification({
        kind: 'error',
        content: 'Failed to accept invite: ' + e.message,
      }));
    });
  };
}

// NOTE: Command
export function displayPeerID(params) {
  return (dispatch, getState) => {
    const peerId = getState().network.peerId;
    dispatch(appendInternalMessage({
      channelId: params.channelId,
      text: 'Your id is: ' + peerId,
    }));
  };
}

// NOTE: Command
export function displayHelp({ channelId }) {
  return appendInternalMessage({
    channelId,
    text: [
      'Available commands:',
      ' - **/help** - print this message',
      ' - **/get-feed-url** - get feed url for current feed',
      ' - **/get-peer-id** - get peer id for debugging purposes',
      ' - **/rename `<channel name>`** - rename current channel',
      ' - **/invite `<invitee name>` `<invite request>`** - ' +
        'invite `<invitee name>`',
      ' - **/accept-invite `<internal>` `<internal>`** - ' +
        'fallback mechanism for accepting invites',
    ].join('\n'),
  });
}

// NOTE: Command
export function displayFeedURL({ channelId }) {
  const run = async (dispatch, getState) => {
    const channel = getState().channels.get(channelId);
    if (!channel) {
      return;
    }

    if (!channel.isFeed) {
      return dispatch(appendInternalMessage({
        channelId,
        text: '/get-feed-url works only on feeds, not channels',
      }));
    }

    return dispatch(appendInternalMessage({
      channelId,
      text: [
        'Feed URL is:',
        '```',
        getFeedURL(channel),
        '```',
      ].join('\n'),
    }));
  };

  return (dispatch, getState) => {
    run(dispatch, getState).catch((e) => {
      dispatch(addNotification({
        kind: 'error',
        content: 'Failed to make channel public: ' + e.message,
      }));
    });
  };
}

// NOTE: Command
export function renameIdentityPair({ channelId, newName }) {
  const save = async (dispatch, getState) => {
    const state = getState();
    const channel = state.channels.get(channelId);
    let identityKey;
    if (state.identities.has(channel.publicKey)) {
      identityKey = channel.publicKey;
    }

    await network.renameIdentityPair({ channelId, identityKey, newName });

    dispatch({
      type: RENAME_IDENTITY_PAIR,
      channelId,
      identityKey,
      newName,
    });
  };

  return (dispatch, getState) => {
    save(dispatch, getState).catch((e) => {
      dispatch(addNotification({
        kind: 'error',
        content: 'Failed to rename channel: ' + e.message,
      }));
    });
  };
}

export function postFile({ channelId, identityKey, files }) {
  // this function handle one file upload only
  const post = async (dispatch) => {
    const message = await network.postMessage({
      channelId,
      identityKey,
      json: {
        files: files,
      },
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

export function postMessage({ channelId, identityKey, text }) {
  // Execute commands
  async function runCommand(dispatch, { channelId, identityKey, text }) {
    const parts = text.trim().split(/\s+/g);

    const commandName = parts.shift().slice(1);
    const args = parts;

    if (!COMMANDS.has(commandName)) {
      return dispatch(appendInternalMessage({
        channelId,
        text: `Unknown command: /${commandName}`,
      }));
    }

    const command = COMMANDS.get(commandName);
    if (command.args.length !== args.length) {
      return dispatch(appendInternalMessage({
        channelId,
        text: 'Invalid command arguments. ' +
        `Expected: /${commandName} ${command.args.join(' ')}`,
      }));
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
