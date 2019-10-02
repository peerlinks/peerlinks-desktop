import React from 'react';
import PropTypes from 'prop-types';

import icons from '../../images/icon';

// todo (tony-go) : add color prop;

const Icon = ({ iconName, ...rest }) => <img src={icons[iconName]} alt={`${iconName} icon`} {...rest}/>;

Icon.propTypes = {
  iconName: PropTypes.oneOf(Object.keys(icons)).isRequired,
};

export default Icon;
