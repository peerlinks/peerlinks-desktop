import moment from 'moment';
import remark from 'remark';
import remarkReact from 'remark-react';
import remarkEmoji from 'remark-emoji';

import binarySearch from 'binary-search';
import { keyToColor } from '../utils';

export function compareMessages(a, b) {
  if (a.height < b.height) {
    return -1;
  } else if (a.height > b.height) {
    return 1;
  }

  if (a.hash > b.hash) {
    return 1;
  } else if (a.hash < b.hash) {
    return -1;
  } else {
    return 0;
  }
}

export function appendMessage(messages, message) {
  let index = binarySearch(messages, message, compareMessages);
  if (index >= 0) {
    // Duplicate
    return;
  }

  index = -1 - index;
  messages.splice(index, 0, enrichMessage(message));
}

export function enrichMessage(message) {
  if (message.isRoot) {
    return Object.assign({}, message, { enriched: null });
  }

  const publicKeys = message.author.publicKeys;
  const displayPath = message.author.displayPath.map((component, i) => {
    const name = component.trim().replace(/^#+/, '');
    const publicKey = publicKeys[i];
    return {
      color: keyToColor(publicKey),
      publicKey: publicKey.toString('hex'),
      name,
    };
  });

  const time = moment(message.timestamp * 1000);

  const text = remark().use(remarkReact).use(remarkEmoji).processSync(
        message.json.text || '').contents;

  // TODO(indutny): highlight mentions
  return {
    ...message,
    enriched: {
      displayPath,
      time: {
        short: time.format('hh:mm:ss'),
        full: time.format('LL'),
      },
      text,
    },
  };
}

export function computeIdentityFilter(list) {
  const sanitized = list.map((name) => {
    // NOTE: We are very conservative
    return name.toLowerCase().replace(/([^a-z0-9])/g, '\\$1');
  });

  return new RegExp(`(\\s|^)(${sanitized.join('|')})([\\s:]|$)`);
}
