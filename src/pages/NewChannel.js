import React from 'react';
import { connect } from 'react-redux';

import FullScreen from '../layouts/FullScreen';

import NewChannelForm from '../components/NewChannelForm';
import InviteRequestForm from '../components/InviteRequestForm';

import './NewChannel.css';

function NewChannel({ identities }) {
  let invite;
  if (identities.length > 0) {
    invite = <React.Fragment>
      <hr/>
      <InviteRequestForm/>
    </React.Fragment>;
  }

  return <FullScreen>
    <div className='new-channel-page'>
      <NewChannelForm/>

      {invite}
    </div>
  </FullScreen>;
}

const mapStateToProps = (state) => {
  return {
    identities: Array.from(state.identities.values()),
  };
};

export default connect(mapStateToProps)(NewChannel);
