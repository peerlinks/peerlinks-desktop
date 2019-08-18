import { combineReducers } from 'redux';

import { appendMessage } from './utils';

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

        const copy = new Map(state);
        copy.set(action.channelId, Object.assign({}, channel, {
          messageHashes,
          messages: appendMessage(channel.messages, action.message),
        }));
        return copy;
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
  identities,
  channels,
});
