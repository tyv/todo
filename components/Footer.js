import React, { PropTypes, Component } from 'react';

export default class Footer extends Component {

  static propTypes = {

  };

  renderStatus() {
    const list = this.props.list;
    const undone = Object
                    .keys(this.props.list)
                    .filter(key => !list[key].done)
                    .length;

    console.log('undone', undone);

    return (
      <span className='footer__undone'>
        {undone ? (undone + ' items left') : 'all done!'}
      </span>
    );
  }

  render() {
    return (
      <footer className='footer'>
        {
          this.renderStatus()
          //this.renderCheckAllControl();
        }
      </footer>
    );
  }
}
