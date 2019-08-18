import React from 'react';
import { connect } from 'react-redux';

import { removeNotification } from '../redux/actions';

function Notifications({ notifications }) {
  return <div>
  </div>;
}

const mapStateToProps = (state) => {
  return {
    notifications: state.notifications,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    removeNotification: (...args) => dispatch(removeNotification(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Notifications);
