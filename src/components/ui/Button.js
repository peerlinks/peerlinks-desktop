import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

// todo : add iconName Props and render Icon component
// todo : replace all buttons in the app

import './Button.css';

const Button = ({ onClick, color, label, ...rest }) => (
  <button
    onClick={onClick}
    className={classNames(
      'button',
      {[`${color}`]: color}
    )}
    {...rest}
  >
    {label}
  </button>
);

Button.propTypes = {
  onClick: PropTypes.func.isRequired,
  color: PropTypes.oneOf([
    'success',
    'danger'
  ])
}

Button.defaultProps ={
  color: "black"
}

export default Button;
