import React from 'react';
import { connect } from 'react-redux';

import { removeNotification } from '../redux/actions';

import './Notifications.css';

function Notifications({ notifications, removeNotification, children }) {
  const render = ({ id, kind, content }) => {
    const dismiss = (e) => {
      e.preventDefault();
      removeNotification({ notificationId: id });
    };

    const className = `notification notification-${kind}`;

    return <div className={className}>
      <div className='notification-content'>{content}</div>
      <button className='notification-dismiss button' onClick={dismiss}>
        dismiss
      </button>
    </div>;
  };
  return <div className='notification-container'>
    <div className='notification-list'>
      {notifications.map((notification) => render(notification))}
    </div>
    <div className='notification-rest'>
      {children}
    </div>
  </div>;
}

const mapStateToProps = (state) => {
  return {
    notifications: state.notifications.list,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    removeNotification: (...args) => dispatch(removeNotification(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Notifications);
