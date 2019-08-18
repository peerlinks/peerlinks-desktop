import { combineReducers } from 'redux';

import { appendMessage } from './utils';

export const singleLoader = (state, action) => {
  if (!state) {
    state = { ready: false, loading: false, error: null };
  }

  switch (action.type) {
    case 'SET_LOADER_READY':
      return Object.assign({}, state, {
        ready: action.ready,
        loading: false,
        error: null,
      });
    case 'SET_LOADER_LOADING':
      return Object.assign({}, state, {
        ready: false,
        loading: action.loading,
        error: null,
      });
    case 'SET_LOADER_ERROR':
      return Object.assign({}, state, {
        loading: false,
        error: action.error,
      });
    default:
      return state;
  }
}

export const loaders = (state, action) => {
  if (!state) {
    state = {
      backend: singleLoader(undefined, {}),
      newChannel: singleLoader(undefined, {}),
    };
  }

  switch (action.type) {
    case 'SET_LOADER_READY':
    case 'SET_LOADING':
    case 'SET_LOADER_ERROR':
      return Object.assign({}, state, {
        [action.target]: singleLoader(state[action.target], action),
      });
    default:
      return state;
  }
};

export const identities = (state = new Map(), action) => {
  switch (action.type) {
    case 'ADD_IDENTITY':
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
    case 'ADD_CHANNEL':
      {
        const copy = new Map(state);
        copy.set(action.channel.id, Object.assign({
          messageHashes: new Set(),
          messages: [],
        }, action.channel));
        return copy;
      }
    case 'APPEND_CHANNEL_MESSAGE':
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

        return Object.assign({}, state, {
          [action.channelId]: Object.assign({}, channel, {
            messageHashes,
            messages: appendMessage(channel.messages, action.message),
          }),
        });
      }
    case 'TRIM_CHANNEL_MESSAGES':
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
  loaders,
  identities,
  channels,
});
