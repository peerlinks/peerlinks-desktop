import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import FullScreen from '../layouts/FullScreen';

import {
  requestInvite,
} from '../redux/actions';

import './InviteRequest.css';

function InviteRequest ({ identities, request, state }) {
  const [ identityKey, setIdentityKey ] = useState(null);

  const options = identities.map((identity) => {
    return <option key={identity.publicKey} value={identity.publicKey}>
      {identity.name}
    </option>;
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
  if (state.request && state.identityKey === identityKey) {
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
    <div className='form-row invite-request-tips'>
      <i>
        <b>Tips</b>:
        <ul>
          <li>Invite request expires after being successfully used.</li>
          <li>Getting invited to a channel grants read and write access</li>
          <li>You can invite your other identity to your own channel</li>
        </ul>
      </i>
    </div>
  </form>;

  return <FullScreen>
    <div className='invite-request-page'>
      {form}
    </div>
  </FullScreen>;
}

InviteRequest.propTypes = {
  identities: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    publicKey: PropTypes.string.isRequired,
  })),
  request: PropTypes.func.isRequired,
  state: PropTypes.shape({
    request: PropTypes.shape({
      request: PropTypes.string,
    }),
    identityKey: PropTypes.string,
    isGenerating: PropTypes.bool,
  }),
};

const mapStateToProps = (state) => {
  return {
    identities: Array.from(state.identities.values()).sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      } else if (a.name > b.name) {
        return 1;
      } else {
        return 0;
      }
    }),
    state: state.inviteRequest,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    request: (...args) => dispatch(requestInvite(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(InviteRequest);
