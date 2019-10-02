import React from 'react';
import PropTypes from 'prop-types';

import Icon from './Icon';
import Button from './Button';
import './File.css';

/*
*
*  File components
*
* */

const withDownload = Component => props => {
  const handleDownload = event => {
    event.preventDefault();
    const a = document.createElement('a');
    a.href = props.data;
    a.download = props.name;
    a.click();
  };

  return <Component handleDownload={handleDownload} {...props}/>;
};

const Image = withDownload(({ src, alt, handleDownload, ...rest }) => (
  <div className='image-file'>
    <div className='overlay' >
      <Icon iconName='downArrow' title='Download' onClick={handleDownload} />
    </div>
    <img src={src} alt={alt} {...rest} />
  </div>
));

const Default = withDownload(({ name, handleDownload, type }) => (
  <div
    className='default-file'
  >
    <div className='content'>
      <Icon iconName='download' title='Download'/>
      <div className='titles'>
        <p>{name}</p><p>{type}</p>
      </div>
    </div>
    <Button onClick={handleDownload} label='download' color='success' />
  </div>
));

/*
*
* File hub component :
*
* */

const File = props => {
  const { name, data } = props;
  const type = props['content-type'];
  const ALLOWED_IMAGE_TYPE = [ 'jpeg', 'png', 'jpg', 'gif', 'heic', 'heif' ];

  if (ALLOWED_IMAGE_TYPE.find(check => type.includes(check))) {
    return <Image src={data} alt={name} />;
  }
  return <Default data={data} name={name} type={type}/>;
};

File.propTypes = {
  name: PropTypes.string.isRequired,
  data: PropTypes.string.isRequired,
  'content-type': PropTypes.string.isRequired,
};

export default File;
