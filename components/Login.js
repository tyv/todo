import React, { PropTypes, Component } from 'react';

export default class Login extends Component {

  render() {
    const login = this.props.login;

    return (
      <div className='login'>
        <h1>Login with</h1>
        <button className="facebook" onClick={login}>Facebook</button>
      </div>
    );
  }
}
