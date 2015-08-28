import React, { PropTypes, Component } from 'react';
import Logout from '../logout/Logout';

export default class Header extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    logout: PropTypes.func.isRequired
  };

  render() {
    return (
      <header className='header line'>
        <Logout logout={this.props.logout}/>
        <h1 className="header__title">
          Todos for {this.props.name}
        </h1>
      </header>
    );
  }
}
