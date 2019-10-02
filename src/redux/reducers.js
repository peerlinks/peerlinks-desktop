import { combineReducers } from 'redux';

import { appendMessage, computeIdentityFilter } from './utils';

import {
  SET_FOCUS,

  SET_REDIRECT,

  NETWORK_READY, NETWORK_NOT_READY, NETWORK_LOADING, NETWORK_ERROR,

  NEW_CHANNEL_RESET, NEW_CHANNEL_SET_IS_LOADING,

  INVITE_REQUEST_GENERATING,
  INVITE_REQUEST_SET_REQUEST,
  INVITE_REQUEST_RESET,

  COMPOSE_UPDATE,

  ADD_NOTIFICATION, REMOVE_NOTIFICATION,

  ADD_IDENTITY, REMOVE_IDENTITY, IDENTITY_ADD_CHANNEL,

  ADD_CHANNEL, REMOVE_CHANNEL, APPEND_CHANNEL_MESSAGE, APPEND_CHANNEL_MESSAGES,
  TRIM_CHANNEL_MESSAGES, CHANNEL_SET_MESSAGE_COUNT, CHANNEL_UPDATE_METADATA,
  CHANNEL_UPDATE_READ_HEIGHT, CHANNEL_SET_CHAIN_MAP,

  RENAME_IDENTITY_PAIR,
} from './actions';

export const focus = (state = true, action) => {
  switch (action.type) {
  case SET_FOCUS: return action.focus;
  default: return state;
  }
};

export const redirect = (state = null, action) => {
  switch (action.type) {
  case SET_REDIRECT:
    return action.to;
  default:
    return state;
  }
};

export const network = (state, action) => {
  if (!state) {
    state = {
      isReady: false,
      isLoading: false,
      error: null,
      isFirstRun: false,
      peerId: null,

      decryptAttempts: 0,
    };
  }

  switch (action.type) {
  case NETWORK_READY:
    return {
      ...state,
      isReady: true,
      isLoading: false,
      error: null,
      isFirstRun: action.isFirstRun,
      decryptAttempts: 0,
      peerId: action.peerId,
    };
  case NETWORK_NOT_READY:
    return {
      ...state,
      isReady: false,
      isLoading: false,
      error: null,
      isFirstRun: action.isFirstRun,
      decryptAttempts: 0,
    };
  case NETWORK_LOADING:
    return {
      ...state,
      isLoading: true,
      error: null,
      decryptAttempts: state.decryptAttempts + 1,
    };
  case NETWORK_ERROR:
    return {
      ...state,
      isLoading: false,
      error: action.error,
    };
  default:
    return state;
  }
};

export const newChannel = (state, action) => {
  if (!state) {
    state = {
      isLoading: false,

      // Invites
      identityKey: null,
      inviteRequest: null,
      inviteChannel: null,
    };
  }

  switch (action.type) {
  case NEW_CHANNEL_RESET:
    return {
      ...state,
      isLoading: false,
      error: null,
    };
  case NEW_CHANNEL_SET_IS_LOADING:
    return { ...state, isLoading: action.isLoading };
  default:
    return state;
  }
};

export const inviteRequest = (state, action) => {
  if (!state) {
    state = {
      isGenerating: false,

      identityKey: null,
      request: null,
    };
  }

  switch (action.type) {
  case INVITE_REQUEST_GENERATING:
    return { ...state, isGenerating: true };
  case INVITE_REQUEST_SET_REQUEST:
    return {
      ...state,
      isGenerating: false,
      identityKey: action.identityKey,
      request: action.request,
    };
  case INVITE_REQUEST_RESET:
    return {
      ...state,
      isGenerating: false,

      request: null,
    };
  default:
    return state;
  }
};

export const compose = (state = {}, action) => {
  switch (action.type) {
  case COMPOSE_UPDATE:
    return {
      ...state,
      [action.channelId]: {
        ...(state[action.channelId] || {}),
        ...action.state,
      },
    };
  case REMOVE_CHANNEL:
  {
    const copy = { ...state };
    delete copy[action.channelId];
    return copy;
  }
  default:
    return state;
  }
};

export const notifications = (state, action) => {
  if (!state) {
    state = {
      nextId: 0,
      list: [],
    };
  }

  switch (action.type) {
  case ADD_NOTIFICATION:
    return {
      ...state,
      nextId: state.nextId + 1,
      list: state.list.concat([ {
        id: state.nextId,

        kind: action.kind,
        content: action.content,
      } ]),
    };
  case REMOVE_NOTIFICATION:
    return {
      ...state,
      list: state.list.filter((notification) => {
        return notification.id !== action.notificationId;
      }),
    };
  default:
    return state;
  }
};

export const identities = (state = new Map(), action) => {
  switch (action.type) {
  case ADD_IDENTITY:
  {
    const copy = new Map(state);
    copy.set(action.identity.publicKey, action.identity);
    return copy;
  }
  case REMOVE_IDENTITY:
  {
    const copy = new Map(state);
    copy.delete(action.identity.publicKey);
    return copy;
  }
  case IDENTITY_ADD_CHANNEL:
  {
    const copy = new Map(state);
    const identity = copy.get(action.identityKey);

    const channelIds = identity.channelIds.slice();
    if (!channelIds.includes(action.channelId)) {
      channelIds.push(action.channelId);
    }

    copy.set(action.identityKey, {
      ...identity,
      channelIds,
    });
    return copy;
  }
  case RENAME_IDENTITY_PAIR:
  {
    if (!action.identityKey || !state.has(action.identityKey)) {
      return state;
    }

    const copy = new Map(state);
    copy.set(action.identityKey, {
      ...copy.get(action.identityKey),
      name: action.newName,
    });
    return copy;
  }
  case REMOVE_CHANNEL:
  {
    const copy = new Map(state);

    // Remove access from channels
    for (const [ key, identity ] of copy) {
      let channelIds = identity.channelIds;
      const index = channelIds.indexOf(action.channelId);
      if (index === -1) {
        continue;
      }

      channelIds = channelIds.slice();
      channelIds.splice(index, 1);

      copy.set(key, {
        ...identity,
        channelIds,
      });
    }
    return copy;
  }
  default:
    return state;
  }
};

export const identityFilter = (state, action) => {
  if (!state) {
    // NOTE: $^ - is a falsey regexp
    state = { filter: /$^/, list: [] };
  }

  switch (action.type) {
  case ADD_IDENTITY:
  {
    const list = state.list.concat([ action.identity.name ]);
    const filter = computeIdentityFilter(list);

    return { filter, list };
  }
  case REMOVE_IDENTITY:
  {
    const index = state.list.indexOf(action.identity.name);
    if (index === -1) {
      return state;
    }

    const list = state.list.slice();
    list.splice(index, 1);
    const filter = computeIdentityFilter(list);
    return { filter, list };
  }
  default:
    return state;
  }
};

const updateChannel = (state, action, body) => {
  if (!state.has(action.channelId)) {
    return state;
  }

  const copy = new Map(state);
  const channel = state.get(action.channelId);
  copy.set(action.channelId, body(channel));
  return copy;
};


export const channels = (state = new Map(), action) => {
  switch (action.type) {
  case ADD_CHANNEL:
  {
    if (state.has(action.channel.id)) {
      return updateChannel(state, {
        channelId: action.channel.id,
      }, (channel) => {
        return {
          ...channel,
          ...action.channel,

          readHeight: action.channel.maxHeight,

          // NOTE: See CHANNEL_SET_CHAIN_MAP below
          activeUsers: [],

          // NOTE: Do not update channel messages
          messages: channel.messages,
        };
      });
    }

    const copy = new Map(state);
    copy.set(action.channel.id, {
      messages: [],

      // NOTE: See CHANNEL_SET_CHAIN_MAP below
      activeUsers: [],

      // Start in all-read state
      messagesRead: action.channel.messageCount,
      readHeight: action.channel.maxHeight,

      ...action.channel,
    });
    return copy;
  }
  case REMOVE_CHANNEL:
  {
    const copy = new Map(state);
    copy.delete(action.channelId);
    return copy;
  }
  case RENAME_IDENTITY_PAIR:
    return updateChannel(state, action, (channel) => {
      return {
        ...channel,
        name: action.newName,
      };
    });
  case CHANNEL_SET_MESSAGE_COUNT:
    return updateChannel(state, action, (channel) => {
      return {
        ...channel,
        messageCount: action.messageCount,
      };
    });
  case CHANNEL_UPDATE_METADATA:
    return updateChannel(state, action, (channel) => {
      return {
        ...channel,
        metadata: {
          ...channel.metadata,
          ...action.metadata,
        },
      };
    });
  case CHANNEL_UPDATE_READ_HEIGHT:
    return updateChannel(state, action, (channel) => {
      if (channel.messages.length === 0) {
        return channel;
      }

      const last = channel.messages[channel.messages.length - 1];
      return {
        ...channel,
        readHeight: Math.max(channel.readHeight, last.height),
      };
    });
  case APPEND_CHANNEL_MESSAGE:
    return updateChannel(state, action, (channel) => {
      const messages = channel.messages;
      appendMessage(messages, action.message);

      return {
        ...channel,
        messages,

        // Posting messages should increment the counter
        messageCount: action.isPosted ? channel.messageCount + 1 :
          channel.messageCount,
      };
    });
  case APPEND_CHANNEL_MESSAGES:
    return updateChannel(state, action, (channel) => {
      const receivedMessages = action.messages;

      const messages = channel.messages.slice();
      for (const message of receivedMessages) {
        appendMessage(messages, message);
      }

      return {
        ...channel,
        messages,
      };
    });
  case TRIM_CHANNEL_MESSAGES:
    return updateChannel(state, action, (channel) => {
      return {
        ...channel,
        messages: channel.messages.slice(-action.count),
      };
    });
  case CHANNEL_SET_CHAIN_MAP:
  {
    const copy = new Map(state);
    const updated = new Set();
    for (const { channelId, chains } of action.map) {
      updated.add(channelId);
      if (!copy.has(channelId)) {
        continue;
      }

      copy.set(channelId, {
        ...copy.get(channelId),

        activeUsers: chains,
      });
    }

    for (const [ channelId, channel ] of copy) {
      if (updated.has(channelId)) {
        continue;
      }

      copy.set(channelId, {
        ...channel,

        activeUsers: [],
      });
    }

    return copy;
  }
  default:
    return state;
  }
};

export default combineReducers({
  focus,
  redirect,
  compose,

  // Various asynchronous states
  network,
  newChannel,
  inviteRequest,
  notifications,

  identities,
  identityFilter,
  channels,
});
