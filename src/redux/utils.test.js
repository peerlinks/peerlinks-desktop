import * as assert from 'assert';

import { appendMessage } from './utils';

it('appends message to empty list', () => {
  const original = [];
  const next = appendMessage(original, { hash: 'a', height: 1 });

  // No modifications
  assert.strictEqual(original.length, 0);

  // Appends
  assert.strictEqual(next.length, 1);
  assert.strictEqual(next[0].hash, 'a');
});

it('sorts by height and then by hash', () => {
  let list = [];
  list = appendMessage(list, { hash: 'a', height: 1 });
  list = appendMessage(list, { hash: 'b', height: 1 });
  list = appendMessage(list, { hash: 'a', height: 2 });
  list = appendMessage(list, { hash: 'c', height: 3 });
  list = appendMessage(list, { hash: 'a', height: 3 });
  list = appendMessage(list, { hash: 'x', height: 0 });

  assert.deepStrictEqual(list.map((msg) => `${msg.height}:${msg.hash}`), [
    '0:x',
    '1:a',
    '1:b',
    '2:a',
    '3:a',
    '3:c',
  ]);
});
