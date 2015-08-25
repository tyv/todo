import * as types from '../constants/ActionTypes';
import isLogged from '../utils/isLogged';

const initialState = {
  status: isLogged()
};

export default function logged(state = initialState, action) {
  let newState;

  switch (action.type) {
    case types.LOGIN_SUCCESS:
      return { status: action.data };

    case types.LOGOUT:
      return { status: false };

    default:
      return state;
  }
}
