import * as types from '../constants/ActionTypes';
import firebase from '../utils/Firebase';

export function login() {
    return dispatch => {
        firebase.authWithOAuthPopup('facebook', (e, payload) => {
              dispatch(e ? loginError(e) : loginSuccess(payload));
        });
    };
};

function loginError(error) {
  return {
    type: types.LOGIN_ERROR,
    error
  };
};

function loginSuccess(data) {
  return {
    type: types.LOGIN_SUCCESS,
    data
  };
};


