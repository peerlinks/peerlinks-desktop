import React from 'react';
import { connect } from 'react-redux';

import { removeNotification } from '../redux/actions';

import './Notifications.css';

const AUTO_DISMISS_DELAY = 15 * 1000; // 15 seconds

function Notifications({ notifications, removeNotification }) {
  const render = ({ id, kind, content }) => {
    const dismiss = (e) => {
      e.preventDefault();
      removeNotification({ notificationId: id });
    };

    if (kind === 'info') {
      setTimeout(() => {
        removeNotification({ notificationId: id });
      }, AUTO_DISMISS_DELAY);
    }

    const className = `notification notification-${kind}`;

    return <div className={className} key={id}>
      <div className='notification-content'>{content}</div>
      <div className='notification-dismiss-container'>
        <button className='notification-dismiss button' onClick={dismiss}>
          dismiss
        </button>
      </div>
    </div>;
  };
  return <div className='notification-container'>
    <div className='notification-list'>
      {notifications.map((notification) => render(notification))}
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
