import React, { PropTypes, Component } from 'react';

export default class Todo extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = {
      drag: false,
      dragOver: false,
      dragDirection: undefined
    };
  }

  static propTypes = {

  };

  onDeleteClick() {
    this.props.deleteTodo(this.props.storeKey);
  }

  onStatusChangeClick() {
    const {changeTodoStatus, todo, storeKey} = this.props;
    changeTodoStatus(storeKey, !todo.done);
  }

  onDragStart(e) {
    e.stopPropagation();

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text', JSON.stringify({ target: this.props.storeKey }));

    this.setState({ drag: true });
  }

  onDragEnd(e) {
    this.setState({
      drag: false,
      dragOver: false,
      dragDirection: undefined
    });
  }

  onDrop(e) {
    if (!this.state.drag) {

      let direction = this.state.dragDirection;
      let target = JSON.parse(e.nativeEvent.dataTransfer.getData('text')).target;

      this.setState({
        drag: false,
        dragOver: false,
        dragDirection: undefined
      });

      this.props.changeTodoPosition(target, direction, this.props.storeKey)
    }
  }

  onDragEnter(e) {
    if (!this.state.drag) {
      this.setState({ dragOver: true });
    }
  }

  onDragOver(e) {
    e.preventDefault();
    if (!this.state.drag) {
      this.setState({
        dragOver: true,
        dragDirection: this.getDragDirection(e)
      });
    }
  }

  onDragLeave(e) {
    if (!this.state.drag) {
      this.setState({
        dragOver: false,
        dragDirection: undefined
      });
    }
  }

  getClassName() {
    const state = this.state;
    const base = 'todos__item';
    let classname = base;

    classname += state.drag ? (' ' + base + '_drag') : '';
    classname += state.dragOver ? (' ' + base + '_dragover') : '';
    classname += state.dragDirection ? (' ' + base + '_drag-' + state.dragDirection) : '';

    return classname;
  }

  getDragDirection(e) {
    const coords = e.target.getBoundingClientRect();
    const half = (coords.bottom - coords.top) / 2;

    return coords.bottom - e.clientY > half ? 'before' : 'after'
  }

  render() {
    const {todo, key, storeKey} = this.props;

    return ( // TODO: fix <label for="..">
      <li
        className={::this.getClassName()}
        onDragStart={::this.onDragStart}
        onDrop={::this.onDrop}
        onDragEnd={::this.onDragEnd}
        onDragEnter={::this.onDragEnter}
        onDragLeave={::this.onDragLeave}
        onDragOver={::this.onDragOver}
        draggable>
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
