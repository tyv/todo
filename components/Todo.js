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
    const {todo, key, storeKey} = this.props;

    return ( // TODO: fix <label for="..">
      <li className='todos__item'>
        <input
          className='todos__cbox custom-input custom-input_type_checkbox'
          id={storeKey}
          onChange={::this.onStatusChangeClick}
          name='todo'
          type="checkbox"
          checked={todo.done} />

        <label
          className='todos__text custom-input custom-input__label'
          htmlFor={storeKey}>
            <i className="custom-input__icon"></i>
            {todo.text}
        </label>

        <span
          className='todos__delete'
          onClick={::this.onDeleteClick}>
        </span>
      </li>
    );
  }
}
