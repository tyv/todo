import * as types from '../constants/ActionTypes';

const initialState = {
  list: {}
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
      let newState = {...state};
      newState.list[action.key] = action.text;
      return newState;

    default:
      return state;
  }
}
