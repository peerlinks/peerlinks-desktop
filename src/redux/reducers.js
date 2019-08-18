import { combineReducers } from 'redux';

import { appendMessage } from './utils';

import {
  NETWORK_READY, NETWORK_LOADING, NETWORK_ERROR,

  NEW_CHANNEL_CREATED, NEW_CHANNEL_RESET, NEW_CHANNEL_IN_PROGRESS,
  NEW_CHANNEL_ERROR,

  ADD_NOTIFICATION, REMOVE_NOTIFICATION,
  ADD_IDENTITY,
  ADD_CHANNEL, APPEND_CHANNEL_MESSAGE, TRIM_CHANNEL_MESSAGES,
} from './actions';

export const network = (state, action) => {
  if (!state) {
    state = { isReady: false, isLoading: false, error: null };
  }

  switch (action.type) {
    case NETWORK_READY:
      return Object.assign({}, state, { isReady: true, isLoading: false });
    case NETWORK_LOADING:
      return Object.assign({}, state, { isLoading: true });
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
    state = { created: null, isLoading: false, error: null };
  }

  switch (action.type) {
    case NEW_CHANNEL_CREATED:
      return Object.assign({}, state, {
        created: { channelId: action.channelId },
        isLoading: false,
      });
    case NEW_CHANNEL_RESET:
      return Object.assign({}, state, {
        created: null,
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
    default:
      return state;
  }
};

export const channels = (state = new Map(), action) => {
  switch (action.type) {
    case ADD_CHANNEL:
      {
        const copy = new Map(state);
        copy.set(action.channel.id, Object.assign({
          messageHashes: new Set(),
          messages: [],
        }, action.channel));
        return copy;
      }
    case APPEND_CHANNEL_MESSAGE:
      {
        const channel = state.get(action.channelId);
        if (!channel) {
          return state;
        }

        const message = action.message;

        // Duplicate
        if (channel.messageHashes.has(message.hash)) {
          return state;
        }

        const messageHashes = new Set(channel.messageHashes);
        messageHashes.add(message.hash);

        const copy = new Map(state);
        copy.set(action.channelId, Object.assign({}, channel, {
          messageHashes,
          messages: appendMessage(channel.messages, action.message),
        }));
        return copy;
      }
    case TRIM_CHANNEL_MESSAGES:
      {
        const channel = state.get(action.channelId);
        if (!channel) {
          return state;
        }

        return Object.assign({}, state, {
          [action.channelId]: Object.assign({}, channel, {
            messages: channel.messages.slice(-action.count),
          }),
        });
      }
    default:
      return state;
  }
};

export default combineReducers({
  // Various asynchronous states
  network,
  newChannel,
  notifications,

  identities,
  channels,
});
