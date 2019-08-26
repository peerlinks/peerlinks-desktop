import { invite } from './actions';

export default new Map([
  [
    'invite',
    { args: [ 'inviteeName', 'request' ], action: invite },
  ],
]);

