import * as types from '../constants/ActionTypes';

const initialState = {
  todos: []
};

export default function todos(state = initialState, action) {
  let newState;

  switch (action.type) {

    case types.USER_TODOS:
      return action.data;

    case types.ADD_TODO:
      return {
        ...state,
        todos: [action.text, ...state.todos]
      };

    default:
      return state;
  }
}
