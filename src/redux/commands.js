import {
  invite, displayHelp, getFeedURL, renameIdentityPair,
} from './actions';

export default new Map([
  [
    'help',
    { args: [ ], action: displayHelp },
  ],
  [
    'invite',
    { args: [ 'inviteeName', 'request' ], action: invite },
  ],
  [
    'get-feed-url',
    { args: [ ], action: getFeedURL },
  ],
  [
    'rename',
    { args: [ 'newName' ], action: renameIdentityPair },
  ],
]);

