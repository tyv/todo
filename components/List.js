import React, { PropTypes, Component } from 'react';
import Todo from '../components/Todo';

export default class List extends Component {

  static propTypes = {

  };

  renderList() {
    const {list, deleteTodo, changeTodoStatus, insertTodo, changeTodoPosition} = this.props;

    return Object.keys(list).reverse().map((key, i) => {
      return (
        <Todo
          key={i}
          storeKey={key}
          todo={list[key]}
          changeTodoStatus={changeTodoStatus}
          changeTodoPosition={changeTodoPosition}
          deleteTodo={deleteTodo} />
        );
    });
  }

  render() {
    return (
      <ol
        className='todos line'>
          {this.renderList()}
      </ol>
    );
  }
}
