import React, { useState } from 'react';
import { connect } from 'react-redux';

import FullScreen from '../layouts/FullScreen';

import {
  requestInvite, inviteRequestReset,
} from '../redux/actions';

import './InviteRequest.css';

function InviteRequest({ identities, request, reset, state }) {
  const [ identityKey, setIdentityKey ] = useState(null);

  const options = identities.map((identity) => {
    return <option key={identity.publicKey} value={identity.publicKey}>
      {identity.name}
    </option>
  });

  // Select first identity
  let identity;
  if (identityKey) {
    identity = identities.find((identity) => {
      return identity.publicKey === identityKey;
    });
  } else {
    setIdentityKey(identities[0].publicKey);
  }

  const onIdentityKey = (e) => {
    setIdentityKey(e.target.value);
  };

  let requestData;
  if (state.request && state.requestKey === identityKey) {
    requestData = `/invite ${identity.name} ${state.request.request}`;
  } else {
    if (identityKey && !state.isGenerating) {
      request({ identityKey });
    }
    requestData = '...generating';
  }

  const onSubmit = (e) => {
    e.preventDefault();
  };

  const form = <form className='invite-request-form' onSubmit={onSubmit}>
    <div className='form-row'>
      <h3 className='title'>Request invite for</h3>
    </div>
    <div className='form-row'>
      <select
        className='form-input invite-request-identity'
        value={identityKey}
        onChange={onIdentityKey}>
        {options}
      </select>
    </div>
    <div className='form-row'>
      Ask your peer to post the code below into their channel:
    </div>
    <div className='form-row'>
      <input
        type='text'
        className='form-input invite-request-data'
        readOnly
        value={requestData}
        onClick={(e) => e.target.select()}
        onChange={(e) => e.preventDefault()}/>
    </div>
    <div className='form-row'>
      <i>NOTE: Invite request expires after being successfully used.</i>
    </div>
  </form>;

  return <FullScreen>
    <div className='invite-request-page'>
      {form}
    </div>
  </FullScreen>;
}

const mapStateToProps = (state) => {
  return {
    identities: Array.from(state.identities.values()),
    state: state.inviteRequest,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    request: (...args) => dispatch(requestInvite(...args)),
    reset: (...args) => dispatch(inviteRequestReset(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(InviteRequest);
