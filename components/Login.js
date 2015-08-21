import React, { PropTypes, Component } from 'react';

export default class Login extends Component {

  render() {
    return (
      <div className='login'>
        <h1 className='login__title'>Login with</h1>
        <button
          className="oauth-btn oauth-btn_facebook"
          onClick={this.props.login}>
            Facebook
        </button>
      </div>
    );
  }
}
