import React, { PropTypes, Component } from 'react';
import firebase from '../utils/Firebase';

export default class Login extends Component {

  onClick() {
    firebase.authWithOAuthPopup('facebook', ::this.authHandler);
  }

  authHandler(error, authData) {
      if (error) {
        console.log("Login Failed!", error);
      } else {
        console.log("Authenticated successfully with payload:", authData);
        console.log(this.props.login.toString());
        this.props.login();
      }
  }

  render() {
    return (
      <div className='login'>
        <h1>Login with</h1>
        <button className="facebook" onClick={::this.onClick}>Facebook</button>
      </div>
    );
  }
}
