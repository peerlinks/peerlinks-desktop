import {
  invite, acceptInvite, displayHelp, getFeedURL, renameIdentityPair,
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
    'accept-invite',
    { args: [ 'requestId', 'box' ], action: acceptInvite },
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

