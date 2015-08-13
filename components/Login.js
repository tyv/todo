import React, { PropTypes, Component } from 'react';

export default class Login extends Component {

  render() {
    return (
      <div className='login'>
        <h1>Login with</h1>
        <button
          className="facebook"
          onClick={this.props.login}>
            Facebook
        </button>
      </div>
    );
  }
}
