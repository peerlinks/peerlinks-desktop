import React from 'react';

import { prerenderUserName } from '../utils';

export default function UserList({ channelName, users }) {
  const renderUser = (user, index) => {
    if (user.displayPath.length === 0) {
      return <div className='user-list-elem'>#{channelName}</div>;
    }

    const { name, color } = prerenderUserName({
      name: user.displayPath[user.displayPath.length - 1],
      publicKey: user.publicKeys[user.publicKeys.length - 1],
    });

    const style = { color };
    return <div className='user-list-elem' style={style}>{name}</div>;
  };

  return <div className='user-list'>
    {users.map(renderUser)}
  </div>;
}
