import * as types from '../constants/ActionTypes';
import * as messages from '../constants/Messages';
import firebase from '../utils/Firebase';

export function login() {
    return dispatch => {
        firebase.authWithOAuthPopup('facebook', (e, payload) => {
              if (e) {
                dispatch(loginError(e));
              } else {
                dispatch(onLogin(payload));
                dispatch(getListByUser(payload.uid));
              }
        });
    };
};

export function logout() {
    return dispatch => {
      firebase.unauth();
      dispatch(onLogout());
    };
};

export function getListByUser(user) {
    return dispatch => {
      dispatch(setLoading());

      let users = firebase.child('users');
      users.once('value', dataSnapshot => {
          const val = dataSnapshot.val();
          if (val && val[user]) { // TODO: dispatch(val ? funca(..) : funcb(..))
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
};

export function changeTodoPosition(sourceTodoId, direction, targetTodoId) {

  return dispatch => {
    const todosRef = firebase.child('users/' + firebase.getAuth().uid);

    let linkedList = {};

    todosRef.once('value', todos => {
      let prev = null;
      todos.forEach(
        todo => {
          let key = todo.key();

          if (!linkedList.start) linkedList.start = key;

          // Creating Doubly-linked list https://en.wikipedia.org/wiki/Doubly-linked_list
          linkedList[key] = {...todo.val(), key: key, before: prev, after: null};
          if (prev) prev.after = linkedList[key];
          prev = linkedList[key];
        }
      );

      let item = linkedList[linkedList.start];

      let source = linkedList[sourceTodoId];
      let target = linkedList[targetTodoId][direction];

      let next;
      let proceed = false;
      let newList = {};
      let foundTarget = false;
      let listDiredtion = 'after';

      while (item) {

        if (proceed) {

          if (item[listDiredtion]) {
            next = { text: item[listDiredtion].text, done: item[listDiredtion].done };
            item[listDiredtion].text = item.text;
            item[listDiredtion].done = item.done;
            item.text = next.text;
            item.done = next.done;
          }

          item = item[listDiredtion];
          continue;

        } else {

          if (item === target) {
            if (foundTarget) {

              if (item[listDiredtion]) {
                next = { text: item[listDiredtion].text, done: item[listDiredtion].done };
                item[listDiredtion].text = item.text;
                item[listDiredtion].done = item.done;
                item.text = next.text;
                item.done = next.done;
              }
              proceed = true;
            }

            foundTarget = true;
            item = item[listDiredtion];
            continue;
          }

          if (item === source) {
            if (foundTarget) listDiredtion = 'before';
            if (item[listDiredtion]) {
              next = { text: item[listDiredtion].text, done: item[listDiredtion].done };
              item[listDiredtion].text = item.text;
              item[listDiredtion].done = item.done;
              item.text = next.text;
              item.done = next.done;
            }
            item = item[listDiredtion];
            proceed = true;
            continue;
          }
        }

        item = item[listDiredtion];
      }

      item = linkedList[linkedList.start];

      while (item) {
        newList[item.key] = { text: item.text, done: item.done };
        item = item.after;
      }

      todosRef.update(newList, (e) => {
        console.log('complete:', e);
      });
      // // let savedTarget = linkedList[targetTodoId][direction];
      // linkedList[targetTodoId][direction] = linkedList[sourceTodoId];


      // dispatch(setLoading());
      // todosRef.update(todosUpdated, () => dispatch(onTodosStatusChanges(status)));
    });
  }
};

function onTodoStatusChanges(key, status) {
  return {
    type: types.CHANGE_TODO_STATUS,
    key,
    status
  };
};

function onTodosStatusChanges(status) {
  return {
    type: types.CHANGE_TODOS_STATUS,
    status
  }
};

function onTodoDeleted(key) {
  return {
    type: types.DELETE_TODO,
    key
  }
};

function onTodoAdded(text, key) {
  return {
    type: types.ADD_TODO,
    text,
    key
  }
};

function loginError(error) {
  return {
    type: types.LOGIN_ERROR,
    error: { message: messages.LOGIN_ERROR, data: error }
  };
};

function onLogin(data) {
  return {
    type: types.LOGIN_SUCCESS,
    data
  };
};

function onLogout() {
  return {
    type: types.LOGOUT
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
