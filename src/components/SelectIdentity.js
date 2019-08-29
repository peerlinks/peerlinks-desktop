import React from 'react';

import './SelectIdentity.css';

export default function SelectIdentity(props) {
  const { children } = props;

  const onChange = (e) => {
    e.preventDefault();
    props.onChange(e.target.value);
  };

  const active = children.find((child) => child.props.value === props.value);

  return <div className={'form-select ' + (props.className || '')}>
    <div className='form-select-label'>
      {active && active.props.label}
    </div>
    <div className='form-select-hidden'>
      <select value={props.value} onChange={onChange}>
        {children}
      </select>
    </div>
  </div>;
}

export const Option = ({ value, label }) => {
  return <option value={value} label={label}/>;
};
