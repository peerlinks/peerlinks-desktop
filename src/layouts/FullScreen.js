import React from 'react';

import './FullScreen.css';

export default function FullScreen({ children }) {
  return <div className='full-screen-layout-container'>
    <div className='full-screen-layout'>
      {children}
    </div>
  </div>;
}
