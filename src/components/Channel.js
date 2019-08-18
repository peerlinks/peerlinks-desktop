import React from 'react';

import MessageList from './MessageList';

import './Channel.css';

const MAX_MESSAGES = 1000;

export default class Channel extends React.Component {
  constructor() {
    super();

    this.state = {
      messages: null,
    };
  }

  async load() {
    const channel = this.props.channel;
    const network = this.props.network;

    const count = await network.getMessageCount(channel.id);
    const messages = await network.getMessagesAtOffset(
      channel.id,
      Math.max(0, count - MAX_MESSAGES), MAX_MESSAGES);

    this.setState({ messages });
  }

  render() {
    const channel = this.props.channel;
    const messages = this.state.messages;

    if (!messages) {
      this.load().catch((e) => {
        // TODO(indutny): display error
        console.error(e.stack);
      });
    }

    const content = messages ? <MessageList messages={messages}/> :
      <div>...loading</div>;

    return (<div className='main-container'>
      <header className='channel-info'>
        #{channel.name}
      </header>
      <section className='channel-content'>
        {content}
      </section>
      <footer className='channel-compose'>
        <div className='channel-compose-container'>
          <button className='channel-compose-identity'>
            identity
          </button>
          <input
            className='channel-compose-text'
            type='text'
            placeholder='Write a message'/>
        </div>
      </footer>
    </div>);
  }
}
