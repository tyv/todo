import React, { PropTypes, Component } from 'react';

export default class Add extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = {
      text: this.props.text || ''
    };
  }

  static propTypes = {

  };

  onAdd() {
    this.props.addTodo(this.state.text, this.props.uid);
  }

  onChange(e) {
    this.setState({ text: e.target.value });
  }

  render() {
    return (
      <div className='add'>
        <input
          placeholder='placeholder' //TODO: props
          onChange={::this.onChange}
          value={this.state.text} />
        <button
          onClick={::this.onAdd}>
            Add
        </button>
      </div>
    );
  }
}
