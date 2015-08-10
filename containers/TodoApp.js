import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { Connector } from 'redux/react';
import Header from '../components/Header';
import Login from '../components/Login';
import MainSection from '../components/MainSection';
import * as TodoActions from '../actions/TodoActions';

export default class TodoApp extends Component {
  render() {
    return (
      <Connector select={state => ({ todos: state.todos.list, login: state.todos.login })}>
        {this.renderChild}
      </Connector>
    );
  }

  renderChild({ todos, login, dispatch }) {
    console.log('>>', todos);
    const actions = bindActionCreators(TodoActions, dispatch);
    const app = (
      <div>
        <Header addTodo={actions.addTodo} />
        <MainSection todos={todos} actions={actions} />
      </div>
    );

    return login.logged ? app : <Login login={actions.login}/>;
  }
}
