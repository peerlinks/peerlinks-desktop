/* eslint-env node, mocha */
import * as assert from 'assert';

import { appendMessage } from './utils';

it('appends message to empty list', () => {
  const original = [];
  const next = original.slice();
  appendMessage(next, { hash: 'a', height: 1 });

  // No modifications
  assert.strictEqual(original.length, 0);

  // Appends
  assert.strictEqual(next.length, 1);
  assert.strictEqual(next[0].hash, 'a');
});

it('sorts by height and then by hash', () => {
  const list = [];
  appendMessage(list, { hash: 'a', height: 1 });
  appendMessage(list, { hash: 'b', height: 1 });
  appendMessage(list, { hash: 'a', height: 2 });
  appendMessage(list, { hash: 'c', height: 3 });
  appendMessage(list, { hash: 'a', height: 3 });
  appendMessage(list, { hash: 'x', height: 0 });

  assert.deepStrictEqual(list.map((msg) => `${msg.height}:${msg.hash}`), [
    '0:x',
    '1:a',
    '1:b',
    '2:a',
    '3:a',
    '3:c',
  ]);
});
