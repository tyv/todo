import React, { Component } from 'react';

export default class Logout extends Component {

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
