import React, { PropTypes, Component } from 'react';

export default class Logout extends Component {

  static propTypes = {
    logout: PropTypes.func.isRequired
  };

  onLogoutClick() {
    this.props.logout();
  }

  render() {
    return (
      <span
        onClick={::this.onLogoutClick}
        className='logout pseudo-link'>
          Logout
      </span>
    );
  }
}
