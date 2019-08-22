import binarySearch from 'binary-search';

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
  messages.splice(index, 0, message);
}
