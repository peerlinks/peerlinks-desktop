import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { setRedirect } from '../redux/actions';

function RedirectOnce ({ redirect, setRedirect }) {
  if (redirect) {
    setRedirect(null);
    return <Redirect to={redirect}/>;
  }
  return null;
}

RedirectOnce.propTypes = {
  redirect: PropTypes.string,
  setRedirect: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  return {
    redirect: state.redirect,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setRedirect: (...args) => dispatch(setRedirect(...args)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(RedirectOnce);
