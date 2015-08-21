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
    const { todos, logged, loading, dispatch } = this.props;
    this.actions = bindActionCreators(TodoActions, dispatch);

    if (logged.status && !loading) {
      this.actions.getListByUser(logged.status.uid);
    }
  }

  renderLogin(actions) {
    return <Login {...this.actions}/>;
  }

  renderList() {
    return <List list={this.props.todos.list} {...this.actions} />
  }

  renderLoading() {
   return (
      <span className='loading'>Loading&hellip;</span>
    );
  }

  renderApp() {
    const {logged, todos} = this.props;
    const list = todos.list;
    const actions = this.actions;
    const name = logged.status[logged.status.provider].displayName;
    return (
      <div className={'todoapp' + (todos.loading ? ' todoapp_loading' : '')}>
        <Header name={name} {...actions} />
        <Add uid={logged.status.uid} {...actions} />
        {todos.loading && this.renderLoading()}
        {Boolean(Object.keys(list).length) && this.renderList()}
        <Footer list={list} {...actions} />
      </div>
    );
  }

  render() {
    const actions = this.actions;

    if (this.props.logged) {
      return this.renderApp();
    } else {
      return this.renderLogin();
    }
  }
};

function select(state) {
  return {
    loading: state.loading,
    todos: state.todos,
    logged: state.logged
  };
};

export default connect(select)(TodoApp);
