import { invite } from './actions';

export default new Map([
  [
    'invite',
    { args: [ 'inviteeName', 'requestId', 'request' ], action: invite },
  ],
]);

