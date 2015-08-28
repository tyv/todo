import React, { PropTypes, Component } from 'react';
import Todo from '../todo/Todo';

export default class List extends Component {

  static propTypes = {
    list: PropTypes.object.isRequired,
    deleteTodo: PropTypes.func.isRequired,
    changeTodoStatus: PropTypes.func.isRequired,
    changeTodoPosition: PropTypes.func.isRequired
  };

  renderList() {
    const {list, deleteTodo, changeTodoStatus, changeTodoPosition} = this.props;
    const todos = [];

    Object.keys(list).forEach((key, i) => {

        todos.push(
          <Todo
            key={i}
            position={list[key].position}
            storeKey={key}
            todo={list[key]}
            changeTodoStatus={changeTodoStatus}
            changeTodoPosition={changeTodoPosition}
            deleteTodo={deleteTodo} />
        );

    });

    // reverse list
    todos.sort((a, b) => parseFloat(b.props.position) - parseFloat(a.props.position));

    return todos;
  }

  render() {
    return (
      <ol className='todos line'>
          {this.renderList()}
      </ol>
    );
  }
}
