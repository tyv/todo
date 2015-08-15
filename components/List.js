import React, { PropTypes, Component } from 'react';
import Todo from '../components/Todo';

export default class List extends Component {

  static propTypes = {

  };

  renderList() {
    const {list, deleteTodo, changeTodoStatus} = this.props;

    return Object.keys(list).map((key, i) => {
      return (
        <Todo
          key={i}
          storeKey={key}
          todo={list[key]}
          changeTodoStatus={changeTodoStatus}
          deleteTodo={deleteTodo} />
        );
    });
  }

  render() {
    return (
      <ol className='list'>
        {this.renderList()}
      </ol>
    );
  }
}
