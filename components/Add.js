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

  onAdd(e) {
    e.preventDefault();
    this.props.addTodo(this.state.text, this.props.uid);
  }

  onChange(e) {
    this.setState({ text: e.target.value });
  }

  render() {
    return (
      <form
        onSubmit={::this.onAdd}
        className='add'>
        <div className='add__col'>
          <input
            className='add__input custom-input custom-input_type_text'
            placeholder='placeholder' //TODO: props
            onChange={::this.onChange}
            value={this.state.text} />
        </div>
        <div className='add__col'>
          <button
            className='add__submit custom-input custom-input_type_button custom-input_action_submit'>
              Add
          </button>
        </div>
      </form>
    );
  }
}
