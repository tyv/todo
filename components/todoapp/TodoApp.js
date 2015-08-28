import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Header from '../header/Header';
import Login from '../login/Login';
import List from '../list/List';
import Footer from '../footer/Footer';
import Add from '../add/Add';
import * as TodoActions from '../../actions/TodoActions';


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
    const isLoading = todos.loading;
    const actions = this.actions;
    const name = logged.status[logged.status.provider].displayName;

    return (
      <div className={'todoapp' + (isLoading ? ' todoapp_loading' : '')}>
        <Header name={name} {...actions} />
        <Add uid={logged.status.uid} loading={isLoading} {...actions} />
        {isLoading && this.renderLoading()}
        {Boolean(Object.keys(list).length) && this.renderList()}
        <Footer list={list} {...actions} />
      </div>
    );
  }

  render() {
    const actions = this.actions;

    return this[
            this.props.logged.status ?
              'renderApp' :
              'renderLogin'
            ]();
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
