import React from 'react';
import PropTypes from 'prop-types';

import './FullScreen.css';

export default function FullScreen ({ children }) {
  return <div className='full-screen-layout-container'>
    <div className='full-screen-layout'>
      {children}
    </div>
  </div>;
}

FullScreen.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element.isRequired),
  ]),
};
