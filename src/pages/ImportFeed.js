import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import FullScreen from '../layouts/FullScreen';

import { importFeed } from '../redux/actions';

import './ImportFeed.css';

function ImportFeed ({ importFeed }) {
  const [ link, setLink ] = useState('');
  const [ publicKey, setPublicKey ] = useState('');
  const [ name, setName ] = useState('');
  const [ isDisabled, setIsDisabled ] = useState(false);

  const onLinkChange = (e) => {
    const value = e.target.value;
    setLink(value);

    let url;
    try {
      url = new URL(value);
      if (url.protocol !== 'peerlinks:') {
        throw new Error('Invalid protocol');
      }

      if (!url.pathname.startsWith('//')) {
        throw new Error('Not URL');
      }

      const path = url.pathname.slice(2).split('/');
      if (path.length !== 2 || path[0] !== 'feed' || !path[1]) {
        throw new Error('Invalid link type');
      }

      setPublicKey(path[1]);
      setIsDisabled(false);
    } catch (e) {
      setPublicKey('');
      setIsDisabled(true);
      return;
    }

    if (url.searchParams.get('name')) {
      setName(url.searchParams.get('name'));
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (isDisabled) {
      return;
    }

    importFeed({ publicKey, channelName: name });
  };

  const form = <form className='new-feed-form' onSubmit={onSubmit}>
    <div className='form-row'>
      <h3 className='title'>Import read-only feed</h3>
    </div>
    <div className='form-row'>
      <input
        className='new-feed-name form-input'
        type='text'
        placeholder='Feed URL'
        value={link}
        onChange={onLinkChange}
        required/>
    </div>
    <div className='form-row'>
      <input
        className='new-feed-name form-input'
        type='text'
        placeholder='Feed name'
        value={name}
        onChange={(e) => setName(e.target.value)}
        required/>
    </div>
    <div className='form-row'>
      <input
        disabled={isDisabled}
        type='submit'
        className='button new-feed-submit'
        value='Import'/>
    </div>
  </form>;

  return <FullScreen>
    <div className='new-feed-page'>
      {form}
    </div>
  </FullScreen>;
}

ImportFeed.propTypes = {
  importFeed: PropTypes.func.isRequired,
};

const mapStateToProps = () => {
  return {
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    importFeed: (...args) => dispatch(importFeed(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ImportFeed);
