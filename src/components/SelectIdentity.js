import React from 'react';
import PropTypes from 'prop-types';

import './SelectIdentity.css';

export default function SelectIdentity (props) {
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

SelectIdentity.propTypes = {
  className: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,

  children: PropTypes.arrayOf(PropTypes.shape({
    props: PropTypes.object.isRequired,
  })),
};

export const Option = ({ value, label }) => {
  return <option value={value} label={label}/>;
};

Option.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};
