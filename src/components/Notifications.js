import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { removeNotification } from '../redux/actions';

import './Notifications.css';

const AUTO_DISMISS_DELAY = 15 * 1000; // 15 seconds

function Notifications ({ notifications, removeNotification }) {
  const render = ({ id, kind, content }) => {
    const remove = () => {
      removeNotification({ notificationId: id });
    };
    const dismiss = (e) => {
      e.preventDefault();
      remove();
    };

    if (kind === 'info') {
      setTimeout(remove, AUTO_DISMISS_DELAY);
    }

    const className = `notification notification-${kind}`;

    let buttonClass = 'notification-dismiss button';
    if (kind === 'error') {
      buttonClass += ' button-danger';
    }

    return <div className={className} key={id}>
      <div className='notification-content'>{content}</div>
      <div className='notification-dismiss-container'>
        <button className={buttonClass} onClick={dismiss}>
          dismiss
        </button>
      </div>
    </div>;
  };
  render.propTypes = {
    id: PropTypes.string.isRequired,
    kind: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
  };

  return <div className='notification-container'>
    <div className='notification-list'>
      {notifications.map((notification) => render(notification))}
    </div>
  </div>;
}

Notifications.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.exact({
    id: PropTypes.string.isRequired,
    kind: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
  })),
  removeNotification: PropTypes.func.isRequired,
};

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
