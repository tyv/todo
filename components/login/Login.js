import React, { PropTypes, Component } from 'react';
import SOCIAL_LOGINS from '../../constants/SocialLogins';

export default class Login extends Component {

  onLogingClick(type) {
    this.props.login(type)
  }

  renderList() {
    return (
      <ul className='login__list'>
        {SOCIAL_LOGINS.map((login, index) => {
          return (
            <li className="login__item" key={index}>
              <button
                className={'oauth-btn icon icon_' + login}
                onClick={this.onLogingClick.bind(this, login)}>
              </button>
            </li>
          )
        })}
      </ul>
    );
  }

  render() {
    return (
      <div className='login'>
        <h1 className='login__title'>Login with</h1>
          <div className='line'></div>
          {this.renderList()}
      </div>
    );
  }
}
