import isLogged from '../utils/isLogged';
import LOGIN from '../constants/ActionTypes';

const initialState = { logged: isLogged() };

export default function logged(state = initialState, action) {
  switch (action.type) {
    case LOGIN:
        console.log(1);
      return { logged: true }
    default:
      return state;
  }
}
