import React, { PropTypes, Component } from 'react';

export default class Header extends Component {
  static propTypes = {

  };

  render() {
    return (
      <header className='header line'>
          <h1 className="header__title">
            Todos for {this.props.name}
          </h1>
      </header>
    );
  }
}
