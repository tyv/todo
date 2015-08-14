import React, { Component } from 'react';
import TodoApp from './TodoApp';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import * as reducers from '../reducers';

const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);
const reducer = combineReducers(reducers);
const store = createStoreWithMiddleware(reducer);

export default class App extends Component {

  render() {
    return (
      <Provider store={store}>
        {() => <TodoApp /> }
      </Provider>
    );
  }
}
