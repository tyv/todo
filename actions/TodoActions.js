import * as types from '../constants/ActionTypes';
import * as messages from '../constants/Messages';
import firebase from '../utils/Firebase';

export function login() {
    return dispatch => {
        firebase.authWithOAuthPopup('facebook', (e, payload) => {
              if (e) {
                dispatch(loginError(e));
              } else {
                dispatch(loginSuccess(payload));
                listByUser(payload.uid, dispatch);
              }
        });
    };
};

export function listByUser(user) {
    return dispatch => {
      let users = firebase.child('users');

      users.once('value', dataSnapshot => {
          const val = dataSnapshot.val();
          if (val) { // TODO: dispatch(val ? funca(..) : funcb(..))
              dispatch(onUserTodoList(val[user]));
          } else {
              users.set({ // TODO: error handling
                  [user]: { todos: '' }
              });
          }
      });
    };
};

export function addTodo(text, uid) {
    return dispatch => {
      let user = firebase.child('users/' + uid);
      user.push(text, e => { if (e) console.log(e); });
    };
};

function onTodoAdded(text) {
  return {
    type: types.ADD_TODO,
    text
  }
}

function loginError(error) {
  return {
    type: types.LOGIN_ERROR,
    error: { message: messages.LOGIN_ERROR, data: error }
  };
};

function loginSuccess(data) {
  return {
    type: types.LOGIN_SUCCESS,
    data
  };
};

function onUserTodoList(data) {
  return {
    type: types.USER_TODOS,
    data
  };
};
