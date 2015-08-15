import * as types from '../constants/ActionTypes';

const initialState = {
  //list: {}
  list: {
    'a1': {
      text: 'aa1',
      done: false
    },
    'a2': {
      text: 'aa2',
      done: true
    },
    'a3': {
      text: 'aa3',
      done: false
    },
    'a4': {
      text: 'aa4',
      done: false
    }
  }
};

export default function todos(state = initialState, action) {
  let newState;

  switch (action.type) {

    case types.USER_TODOS:
      return {
        ...state,
        list: action.data
      };

    case types.ADD_TODO:
      newState = {...state};
      newState.list[action.key] = {
        text: action.text,
        done: false
      };
      return newState;

    case types.DELETE_TODO:
      newState = {...state};
      delete newState.list[action.key];
      return newState;

    case types.CHANGE_TODO_STATUS:
      newState = {...state};
      newState.list[action.key].done = action.status;
      return newState;

    case types.CHANGE_TODOS_STATUS:
      newState = {...state};
      Object
        .keys(newState.list)
          .forEach(key => {
            newState.list[key].done = action.status;
          });
      console.log(newState);
      return newState;

    default:
      return state;
  }
}
