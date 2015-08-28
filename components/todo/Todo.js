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
    deleteTodo: PropTypes.func.isRequired,
    storeKey: PropTypes.string.isRequired,
    todo: PropTypes.object.isRequired,
    changeTodoStatus: PropTypes.func.isRequired,
    position: PropTypes.number.isRequired

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
    e.dataTransfer.setData('text', JSON.stringify({target: this.props.storeKey}));

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

    let direction = this.state.dragDirection;

    if (!this.state.drag && direction) {

      let newPosition;
      let target = JSON.parse(e.nativeEvent.dataTransfer.getData('text')).target;

      this.setState({
        drag: false,
        dragOver: false,
        dragDirection: undefined
      });

      if (direction === 'after') newPosition = this.props.position - 0.5;
      if (direction === 'before') newPosition = this.props.position + 0.5;
      this.props.changeTodoPosition(target, newPosition);
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
    const {todo, storeKey} = this.props;

    return (
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
