import * as types from '../constants/ActionTypes';

const initialState = {
  loading: false,
  list: {}
};

export default function todos(state = initialState, action) {

  let newState = {
    ...state,
    loading: false
  };

  switch (action.type) {

    case types.USER_TODOS:
      return {
        ...newState,
        list: action.data || {}
      };

    case types.USER_TODOS_LOAD:
      return {
        ...newState,
        loading: true
      };

    case types.ADD_TODO:
      newState.list[action.key] = {
        text: action.text,
        done: false
      };
      return newState;

    case types.DELETE_TODO:
      delete newState.list[action.key];
      return newState;

    case types.CHANGE_TODO_STATUS:
      newState.list[action.key].done = action.status;
      return newState;

    case types.CHANGE_TODOS_STATUS:
      Object
        .keys(newState.list)
          .forEach(key => {
            newState.list[key].done = action.status;
          });
      return newState;

    case types.LOGOUT:
      return {
        loading: false,
        list: {}
      };

    default:
      return state;
  }
}
