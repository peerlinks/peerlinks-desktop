// channels

export function addChannel(channel) {
  return { type: 'ADD_CHANNEL', channel };
}

export function appendChannelMessage(channel, message) {
  return { type: 'APPEND_CHANNEL_MESSAGE', id: channel.id, message };
}

export function trimChannelMessages(channel, count) {
  return { type: 'TRIM_CHANNEL_MESSAGES', id: channel.id, count };
}
