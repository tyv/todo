import * as types from '../constants/ActionTypes';
import firebase from '../utils/Firebase';

export function login() {
    return dispatch => {
        firebase.authWithOAuthPopup('facebook', (e, payload) => {
              if (e) {
                dispatch(loginError(e));
              } else {
                dispatch(loginSuccess(payload));
                listByUserTransaction(payload.uid);
              }
        });
    };
};

function listByUserTransaction(user) {
    let users = firebase.child(user);

    users.set({ list: [] });

    users.on('value', dataSnapshot => {
        console.log(dataSnapshot.val());
    });

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


