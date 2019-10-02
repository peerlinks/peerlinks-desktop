import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

// todo (tony-go) : add iconName Props and render Icon component
// todo (tony-go) : replace all buttons in the app

import './Button.css';

const Button = ({ onClick, color, label, ...rest }) => (
  <button
    onClick={onClick}
    className={classNames(
      'button',
      { [`${color}`]: color }
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
    'danger',
  ]),
  label: PropTypes.string.isRequired,
};

Button.defaultProps = {
  color: 'black',
};

export default Button;
