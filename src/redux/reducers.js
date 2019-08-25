import { combineReducers } from 'redux';

import { appendMessage, computeIdentityFilter } from './utils';

import {
  SET_REDIRECT,

  NETWORK_READY, NETWORK_NOT_READY, NETWORK_LOADING, NETWORK_ERROR,

  NEW_CHANNEL_RESET, NEW_CHANNEL_IN_PROGRESS,
  NEW_CHANNEL_ERROR,

  INVITE_REQUEST_GENERATING, INVITE_REQUEST_WAITING,
  INVITE_REQUEST_SET_IDENTITY_KEY, INVITE_REQUEST_SET_REQUEST,
  INVITE_REQUEST_RESET,

  ADD_NOTIFICATION, REMOVE_NOTIFICATION,

  ADD_IDENTITY, REMOVE_IDENTITY, IDENTITY_ADD_CHANNEL,

  ADD_CHANNEL, REMOVE_CHANNEL, APPEND_CHANNEL_MESSAGE, APPEND_CHANNEL_MESSAGES,
  TRIM_CHANNEL_MESSAGES, CHANNEL_SET_MESSAGE_COUNT, CHANNEL_UPDATE_METADATA,
} from './actions';

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
    state = { isReady: false, isLoading: false, error: null };
  }

  switch (action.type) {
    case NETWORK_READY:
      return Object.assign({}, state, {
        isReady: true,
        isLoading: false,
        error: null,
      });
    case NETWORK_NOT_READY:
      return Object.assign({}, state, {
        isReady: false,
        isLoading: false,
        error: null,
      });
    case NETWORK_LOADING:
      return Object.assign({}, state, { isLoading: true, error: null });
    case NETWORK_ERROR:
      return Object.assign({}, state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};

export const newChannel = (state, action) => {
  if (!state) {
    state = {
      isLoading: false,
      error: null,

      // Invites
      identityKey: null,
      inviteRequest: null,
      inviteChannel: null,
    };
  }

  switch (action.type) {
    case NEW_CHANNEL_RESET:
      return Object.assign({}, state, {
        isLoading: false,
        error: null,
      });
    case NEW_CHANNEL_IN_PROGRESS:
      return Object.assign({}, state, { isLoading: true });
    case NEW_CHANNEL_ERROR:
      return Object.assign({}, state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};

export const inviteRequest = (state, action) => {
  if (!state) {
    state = {
      isGenerating: false,
      isWaiting: false,

      identityKey: null,
      requestKey: null,
      request: null,
    };
  }

  switch (action.type) {
    case INVITE_REQUEST_GENERATING:
      return Object.assign({}, state, { isGenerating: true });
    case INVITE_REQUEST_WAITING:
      return Object.assign({}, state, { isWaiting: true });
    case INVITE_REQUEST_SET_IDENTITY_KEY:
      return Object.assign({}, state, {
        identityKey: action.identityKey,
      });
    case INVITE_REQUEST_SET_REQUEST:
      return Object.assign({}, state, {
        isGenerating: false,
        isWaiting: false,
        requestKey: action.identityKey,
        request: action.request,
      });
    case INVITE_REQUEST_RESET:
      return Object.assign({}, state, {
        isGenerating: false,
        isWaiting: false,

        request: null,
      });
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
      return Object.assign({}, state, {
        nextId: state.nextId + 1,
        list: state.list.concat([ {
          id: state.nextId,

          kind: action.kind,
          content: action.content,
        } ]),
      });
    case REMOVE_NOTIFICATION:
      return Object.assign({}, state, {
        list: state.list.filter((notification) => {
          return notification.id !== action.notificationId;
        }),
      });
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

        copy.set(action.identityKey, Object.assign({}, identity, {
          channelIds,
        }));
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
        // Do not overwrite existing messages for self-invite
        if (state.has(action.channel.id)) {
          return state;
        }

        const copy = new Map(state);
        copy.set(action.channel.id, Object.assign({
          messages: [],

          // Start in all-read state
          messagesRead: action.channel.messageCount,
        }, action.channel));
        return copy;
      }
    case REMOVE_CHANNEL:
      {
        const copy = new Map(state);
        copy.delete(action.channelId);
        return copy;
      }
    case CHANNEL_SET_MESSAGE_COUNT:
      return updateChannel(state, action, (channel) => {
        return Object.assign({}, channel, {
          messageCount: action.messageCount,
        });
      });
    case CHANNEL_UPDATE_METADATA:
      return updateChannel(state, action, (channel) => {
        return Object.assign({}, channel, {
          metadata: Object.assign({}, channel.metadata, action.metadata),
        });
      });
    case APPEND_CHANNEL_MESSAGE:
      return updateChannel(state, action, (channel) => {
        const messages = channel.messages;
        appendMessage(messages, action.message);

        return Object.assign({}, channel, {
          messages,

          // Posting messages should increment the counter
          messageCount: action.isPosted ? channel.messageCount + 1 :
            channel.messageCount,
        });
      });
    case APPEND_CHANNEL_MESSAGES:
      return updateChannel(state, action, (channel) => {
        const receivedMessages = action.messages;

        const messages = channel.messages.slice();
        for (const message of receivedMessages) {
          appendMessage(messages, message);
        }

        return Object.assign({}, channel, {
          messages,
        });
      });
    case TRIM_CHANNEL_MESSAGES:
      return updateChannel(state, action, (channel) => {
        return Object.assign({}, channel, {
          messages: channel.messages.slice(-action.count),
        });
      });
    default:
      return state;
  }
};

export default combineReducers({
  redirect,

  // Various asynchronous states
  network,
  newChannel,
  inviteRequest,
  notifications,

  identities,
  identityFilter,
  channels,
});
