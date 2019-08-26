import { invite, displayHelp, displayFeedURL } from './actions';

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
    { args: [ ], action: displayFeedURL },
  ],
]);

