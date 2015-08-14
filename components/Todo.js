import React, { PropTypes, Component } from 'react';

export default class Todo extends Component {

  static propTypes = {

  };

  render() {
    return (
      <li key={this.props.key} className='list__item'>
        {this.props.todo}
      </li>
    );
  }
}
