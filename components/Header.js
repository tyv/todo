import React, { PropTypes, Component } from 'react';

export default class Header extends Component {
  static propTypes = {

  };

  render() {
    return (
      <header className='header'>
          <h1>
            TODO list for {this.props.name}
          </h1>
      </header>
    );
  }
}
