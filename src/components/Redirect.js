import React from 'react';
import { connect } from 'react-redux';
import { Redirect as RouterRedirect } from 'react-router-dom';

import { setRedirect } from '../redux/actions';

function Redirect({ redirect, setRedirect }) {
  if (redirect) {
    setRedirect(null);
    return <RouterRedirect to={redirect}/>;
  }
  return null;
}

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

export default connect(mapStateToProps, mapDispatchToProps)(Redirect);
