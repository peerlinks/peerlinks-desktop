import * as assert from 'assert';

import { channels } from './reducers';
import {
  addChannel,
  appendChannelMessage,
} from './actions';

it('appends channel to empty list', () => {
  const state = channels(undefined, addChannel({ id: 'a' }));
  assert.strictEqual(state['a'].id, 'a');
  assert.strictEqual(state['a'].messages.length, 0);
  assert.strictEqual(state['a'].messageHashes.size, 0);
});

it('appends messages to the channel', () => {
  let state = channels(undefined, addChannel({ id: 'a' }));
  state = channels(state, appendChannelMessage({ id: 'a' }, {
    height: 1,
    hash: 'b',
  }));
  state = channels(state, appendChannelMessage({ id: 'a' }, {
    height: 1,
    hash: 'a',
  }));

  // Duplicate
  state = channels(state, appendChannelMessage({ id: 'a' }, {
    height: 1,
    hash: 'a',
  }));

  const channel = state['a'];
  assert.strictEqual(channel.messageHashes.size, 2);
  assert.strictEqual(channel.messages.length, 2);
  assert.deepStrictEqual(channel.messages.map((m) => `${m.height}:${m.hash}`), [
    '1:a',
    '1:b',
  ]);
});
