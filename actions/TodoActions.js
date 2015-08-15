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
                getListByUser(payload.uid, dispatch);
              }
        });
    };
};

export function getListByUser(user) {
    return dispatch => {
      let users = firebase.child('users');

      users.once('value', dataSnapshot => {
          const val = dataSnapshot.val();
          if (val) { // TODO: dispatch(val ? funca(..) : funcb(..))
              dispatch(onUserTodoList(val[user]));
          } else {
              users.set({ // TODO: error handling
                  [user]: {}
              });
          }
      });
    };
};

export function addTodo(text, uid) {
  console.log('addTodo');
    return dispatch => {
      let user = firebase.child('users/' + uid);

      let push = user.push(text, (e) => {
        if (e) { console.log(e); }   // TODO: handle error
      });

      user.once('value', payload => {
        console.log('once');
        const key = push.key();
        dispatch(onTodoAdded(payload.val()[key], key));
      });
    };
};

export function deleteTodo(key) {
  return dispatch => {
    // TODO: saving to Firebase

    dispatch(onTodoDeleted(key));
  }
}

export function changeTodoStatus(key, status) {
  return dispatch => {
    // TODO: saving to Firebase
    //
    dispatch(onTodoStatusChanges(key, status));
  }
}

function onTodoStatusChanges(key, status) {
  return {
    type: types.CHANGE_TODO_STATUS,
    key,
    status
  }
}

function onTodoDeleted(key) {
  return {
    type: types.DELETE_TODO,
    key
  }
}

function onTodoAdded(text, key) {
  return {
    type: types.ADD_TODO,
    text,
    key
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
