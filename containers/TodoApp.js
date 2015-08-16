import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Header from '../components/Header';
import Login from '../components/Login';
import List from '../components/List';
import Footer from '../components/Footer';
import Add from '../components/Add';
import * as TodoActions from '../actions/TodoActions';


class TodoApp extends Component {
  componentWillMount() {
    const { todos, logged, dispatch } = this.props;
    this.actions = bindActionCreators(TodoActions, dispatch);

    if (logged.status
          && !Object.keys(todos.list).length) {
      this.actions.getListByUser(logged.status.uid);
      this.setState({ loading: true });
    } else {
      this.setState({ loading: false });
    }
  }

  renderLogin(actions) {
    return <Login {...actions}/>;
  }

  rednerList(list, actions) {
   return <List list={list} {...actions} />
  }

  renderLoading() {
   return (
      <span className='loading'>Loading&hellip;</span>
    );
  }

  renderApp(actions, logged, todos) {
    const name = logged.status[logged.status.provider].displayName;

    return (
      <div>
        <Header name={name} {...actions} />
        <Add uid={logged.status.uid} {...actions} />
        { this.state.loading ? this.renderLoading() : this.rednerList(todos.list, actions) }
        <Footer list={todos.list} {...actions} />
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
