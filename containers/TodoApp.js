import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Header from '../components/Header';
import Login from '../components/Login';
import * as TodoActions from '../actions/TodoActions';


class TodoApp extends Component {
  render() {
    const { todos, logged, dispatch } = this.props;
    const actions = bindActionCreators(TodoActions, dispatch);
    const app = (
      <div>
        <Header {...actions} />
      </div>
    );
    return logged.status ? app : <Login {...actions}/>;
  }
};

function select(state) {
  return {
    todos: state.todos,
    logged: state.logged
  };
};

export default connect(select)(TodoApp);
