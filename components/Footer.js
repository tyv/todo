import React, { PropTypes, Component } from 'react';

export default class Footer extends Component {

  static propTypes = {

  };

  onSelectControlClick(undone) {
    this.props.changeTodosStatus(Boolean(undone));
  }

  renderFooter() {
    const list = this.props.list;
    const keys = Object.keys(this.props.list);
    const undone = keys.filter(key => !list[key].done).length;

    return (
      <div>
        {this.renderUndone(undone)}
        {'---====---'}
        {this.renderSelectControl(undone, keys)}
      </div>
    );
  }

  renderSelectControl(undone, list) {
    if (list.length) {
      return (
        <span onClick={this.onSelectControlClick.bind(this, undone)}
          className="footer__select-control">
          {undone ? 'Mark all completed' : 'Mark all undone'}
        </span>
      );
    }
  }

  renderUndone(undone) {
    return (
      <span className='footer__undone'>
        {undone ? (undone + ' items left') : 'all done!'}
      </span>
    );
  }

  render() {
    return (
      <footer className='footer'>
        {this.renderFooter()}
      </footer>
    );
  }
}
