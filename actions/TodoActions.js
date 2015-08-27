import * as types from '../constants/ActionTypes';
import * as messages from '../constants/Messages';
import firebase from '../utils/Firebase';

let defaultPosition = 0;

export function login(type) {
    return dispatch => {
        firebase.authWithOAuthPopup(type, (e, payload) => {
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

      let users = firebase.child('users/' + user);

      users.once('value', dataSnapshot => {
        defaultPosition = dataSnapshot.numChildren(); // Save position in closure
        dispatch(onUserTodoList(dataSnapshot.val()));
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
          position: ++defaultPosition,
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
      .remove(e => {
        if (!e) {
          dispatch(onTodoDeleted(key))
        }
      });
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

export function changeTodoPosition(target, newPosition) {

  return dispatch => {

    dispatch(setLoading());

    const todosRef = firebase.child('users/' + firebase.getAuth().uid);

    let todosAsArray = [];
    let targetObj;

    todosRef.once('value', dataSnapshot => {

      dataSnapshot.forEach(todo => {
        const todoWithKey = {...todo.val(), key: todo.key()};
        todosAsArray.push(todoWithKey);
        if (target === todoWithKey.key) targetObj = todoWithKey;

      });

      todosAsArray.sort((a, b) => parseFloat(b.position) - parseFloat(a.position));

      let organizedTodos = getOrganizedTodos(
                              newPosition,
                              [...todosAsArray],
                              targetObj
                            );

      let newList = {};
      let index = organizedTodos.length;

      defaultPosition = index; // Save position in closure

      organizedTodos.forEach((todo) => {
        const {text, done} = todo;

        newList[todo.key] = {
          text,
          done,
          position: index--
        }
      });

      dispatch(onChahgeTodoPosition(newList));
      todosRef.update(newList, e => {
        if (e) console.log(e); // TODO: hadle error
      });
    });
  };
};

function getOrganizedTodos(newPosition, todosAsArray, targetObj) {

  let organizedTodos;

  let needInsertBefore = newPosition > todosAsArray[0].position;
  let needInsertAfter = !needInsertBefore && (newPosition > todosAsArray[0].position);

  if (needInsertBefore || needInsertAfter) {

    todosAsArray.splice(todosAsArray.indexOf(targetObj), 1);

    organizedTodos = needInsertBefore ?
                      [targetObj, ...todosAsArray] :
                      [...todosAsArray, targetObj];
  } else {

    organizedTodos = [];

    todosAsArray.forEach(todo => {
      if (targetObj.key !== todo.key) {
        organizedTodos.push(todo);
        if (newPosition < todo.position) organizedTodos.push(targetObj);
      }
    });
  }

  return organizedTodos;

};

function onChahgeTodoPosition(list) {
  return {
    type: types.CHANGE_TODO_POSITION,
    list
  };
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

function onTodoAdded(todo, key) {
  return {
    type: types.ADD_TODO,
    todo,
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
    data: data || {}
  };
};

function setLoading() {
  return {
    type: types.USER_TODOS_LOAD
  };
};
