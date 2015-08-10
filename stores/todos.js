import { ADD_TODO, DELETE_TODO, EDIT_TODO, MARK_TODO, MARK_ALL, CLEAR_MARKED, LOGIN } from '../constants/ActionTypes';
import isLogged from '../utils/isLogged';

const initialState = {
  login: { logged: Boolean(isLogged()) },
  list: [{
    text: 'Use Redux',
    marked: false,
    id: 0
  }]
};

export default function todos(state = initialState, action) {
  let newState;

  switch (action.type) {
  case 'LOGIN':
    newState = {...state, login: { logged: true }};

    console.log(newState)
    return newState;

  case ADD_TODO:
    newState = {
      ...state,
      list: [{
        id: (state.list.length === 0) ? 0 : state.list[0].id + 1,
        marked: false,
        text: action.text
      }, ...state.list]
    };
    return newState;

  case DELETE_TODO:
    return state.filter(todo =>
      todo.id !== action.id
    );

  case EDIT_TODO:
    return state.map(todo =>
      todo.id === action.id ?
        { ...todo, text: action.text } :
        todo
    );

  case MARK_TODO:
    return state.map(todo =>
      todo.id === action.id ?
        { ...todo, marked: !todo.marked } :
        todo
    );

  case MARK_ALL:
    const areAllMarked = state.every(todo => todo.marked);
    return state.map(todo => ({
      ...todo,
      marked: !areAllMarked
    }));

  case CLEAR_MARKED:
    return state.filter(todo => todo.marked === false);

  default:
    return state;
  }
}
