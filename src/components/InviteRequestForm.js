import React, { useState } from 'react';
import { connect } from 'react-redux';

import {
  requestInvite, inviteRequestReset,
} from '../redux/actions';

import './InviteRequestForm.css';

function InviteRequestForm({ identities, request, reset, state }) {
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

  return <div className='invite-request-form'>
    <div className='form-row'>
      <h3 className='title'>...or request invite for:</h3>
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
      <textarea
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
  </div>;
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

export default connect(mapStateToProps, mapDispatchToProps)(InviteRequestForm);
