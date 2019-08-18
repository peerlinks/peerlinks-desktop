import React from 'react';

import ChannelList from '../components/ChannelList';
import Channel from '../components/Channel';
import NewChannel from '../components/NewChannel';

import './Index.css';

export default class Index extends React.Component {
  constructor() {
    super();

    this.state = {
      channels: null,
      identities: null,
      currentChannel: null,
      content: null,
    };
  }

  render() {
    const network = this.props.network;
    const currentChannel = this.state.currentChannel;
    const channels = this.state.channels;

    const setCurrentChannel = (channel) => {
      this.setState({
        content: 'channel',
        currentChannel: channel,
      });
    };

    const newChannel = () => {
      this.setState({
        content: 'new-channel',
      });
    };

    const onNewChannel = async (channelName) => {
      this.setState({
        content: null,
      });

      const { identity, channel } = await network.createIdentityPair(
        channelName);

      // TODO(indutny): sort
      this.setState({
        content: 'channel',
        identities: this.state.identities.concat([ identity ]),
        channels: this.state.channels.concat([ channel ]),
        currentChannel: channel,
      });
    };

    let content;
    switch (this.state.content) {
      case 'channel':
        content = <Channel
          network={network}
          channel={currentChannel}/>;
        break;
      case 'new-channel':
        content = <NewChannel
          onNewChannel={onNewChannel}/>;
        break;
      default:
        // TODO(indutny): style it properly
        content = '...loading';
        break;
    }

    return (
      <div className='channel'>
        <aside className='sidebar'>
          <h6 className='title'>channels:</h6>

          {
            // TODO(indutny): style it properly
            this.state.content === null ?
              <p>...loading</p> :
              <ChannelList
                channels={channels}
                selected={currentChannel}
                onChannelSelect={setCurrentChannel}
                newChannel={newChannel}/>
          }
        </aside>

        <div className='main'>
          {content}
        </div>
      </div>
    );
  }
}
