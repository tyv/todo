import * as types from '../constants/ActionTypes';
import isLogged from '../utils/isLogged';

const initialState = {
  status: isLogged()
};

export default function logged(state = initialState, action) {
  let newState;

  switch (action.type) {

    case types.LOGIN_SUCCESS:
      console.log('STORE LOGIN S');
      return { status: action.data };

    default:
      console.log(action);
      return state;
  }
}
