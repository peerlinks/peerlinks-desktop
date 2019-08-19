import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { } from '../redux/actions';

import FullScreen from '../layouts/FullScreen';

function Invite({ match, newChannel, newChannelReset, state }) {
  const { id: channelId } = match.params;

  const onSubmit = (e) => {
    e.preventDefault();
  };

  return <FullScreen>
    <form onSubmit={onSubmit}>
      <textarea placeholder='Paste the invite request here'/>
    </form>
  </FullScreen>;
}

const mapStateToProps = (state) => {
  return {
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Invite);
