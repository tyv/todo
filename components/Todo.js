import React, { PropTypes, Component } from 'react';

export default class Todo extends Component {

  static propTypes = {

  };

  onDeleteClick() {
    this.props.deleteTodo(this.props.storeKey);
  }

  onStatusChangeClick() {
    const {changeTodoStatus, todo, storeKey} = this.props;
    changeTodoStatus(storeKey, !todo.done);
  }

  render() {
    const {todo, key} = this.props;

    return (
      <li key={key} className='list__item'>
        <label>
          <input
            onChange={::this.onStatusChangeClick}
            type="checkbox"
            checked={todo.done} />

            {todo.text}

          </label>

        <button
          onClick={::this.onDeleteClick}>
            [ delete ]
        </button>
      </li>
    );
  }
}
