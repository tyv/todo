import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Header from '../components/Header';
import Login from '../components/Login';
import List from '../components/List';
import Add from '../components/Add';
import * as TodoActions from '../actions/TodoActions';


class TodoApp extends Component {
  componentWillMount() {
    const { todos, logged, dispatch } = this.props;
    this.actions = bindActionCreators(TodoActions, dispatch);

    if (logged.status
          && !Object.keys(todos.list).length) {
      this.actions.getListByUser(logged.status.uid);
    }
  }

  renderLogin(actions) {
    return <Login {...actions}/>;
  }

  renderApp(actions, logged, todos) {
    return (
      <div>
        <Header {...actions} />
        <Add uid={logged.status.uid} {...actions} />
        <List list={todos.list} />
      </div>
    );
  }

  render() {
    const { todos, logged } = this.props;
    const actions = this.actions;

    if (logged.status) {
      return this.renderApp(actions, logged, todos);
    } else {
      return this.renderLogin(actions);
    }
  }
};

function select(state) {
  return {
    todos: state.todos,
    logged: state.logged
  };
};

export default connect(select)(TodoApp);
