import React, { PropTypes, Component } from 'react';
import Logout from '../logout/Logout';

export default class Header extends Component {
  static propTypes = {

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
