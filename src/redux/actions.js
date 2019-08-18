//
// identities
//

export function addIdentity(identity) {
  return { type: 'ADD_IDENTITY', identity };
}

//
// channels
//

export function addChannel(channel) {
  return { type: 'ADD_CHANNEL', channel };
}

export function appendChannelMessage({ channelId, message }) {
  return { type: 'APPEND_CHANNEL_MESSAGE', channelId, message };
}

export function trimChannelMessages({ channelId, count }) {
  return { type: 'TRIM_CHANNEL_MESSAGES', channelId, count };
}
