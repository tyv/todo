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
      dispatch(setLoading());

      let users = firebase.child('users');
      users.once('value', dataSnapshot => {
          const val = dataSnapshot.val();
          if (val) { // TODO: dispatch(val ? funca(..) : funcb(..))
              dispatch(onUserTodoList(val[user]));
          } else {
              users.set(
                {
                    [user]: {}
                },
                () => dispatch(onUserTodoList())
              );
          }
      });
    };
};

export function addTodo(text, uid) {
    return dispatch => {
      dispatch(setLoading());

      let user = firebase.child('users/' + uid);
      let push = user.push(
        {
          text,
          done: false
        },
        (e) => {
          if (e) { console.log(e); }   // TODO: handle error
        }
      );

      user.once('value', payload => {
        const key = push.key();
        dispatch(onTodoAdded(payload.val()[key], key));
      });
    };
};

export function deleteTodo(key) {
  return dispatch => {
    dispatch(setLoading());
    firebase
      .child('users/' + firebase.getAuth().uid + '/' + key)
      .remove(() => dispatch(onTodoDeleted(key)));
  };
}

export function changeTodoStatus(key, status) {
  return dispatch => {
    dispatch(setLoading());
    firebase
      .child('users/' + firebase.getAuth().uid + '/' + key)
      .update(
        { done: status },
        () => dispatch(dispatch(onTodoStatusChanges(key, status)))
      );
  };
}

export function changeTodosStatus(status) {
  return dispatch => {
    dispatch(setLoading());
    let todosUpdated = {};
    const todosRef = firebase.child('users/' + firebase.getAuth().uid);

      todosRef.once('value', todos => {
        todos.forEach(
          todo => {
            todosUpdated[todo.key()] = {...todo.val(), done: status};
          }
        );
        dispatch(setLoading());
        todosRef.update(todosUpdated, () => dispatch(onTodosStatusChanges(status)));
      });
  }
}


function onTodoStatusChanges(key, status) {
  return {
    type: types.CHANGE_TODO_STATUS,
    key,
    status
  }
}

function onTodosStatusChanges(status) {
  return {
    type: types.CHANGE_TODOS_STATUS,
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

function setLoading() {
  return {
    type: types.USER_TODOS_LOAD
  };
};
