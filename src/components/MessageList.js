import React from 'react';

export default function MessageList(props) {
  const messages = props.messages.map((message) => {
    return (<article key={message.hash}>
      {message.isRoot ? '<root>' : message.json.text}
    </article>);
  });

  return (<div className='message-list'>
    {messages}
  </div>);
}
