import React, { PropTypes, Component } from 'react';
import Todo from '../components/Todo';

export default class List extends Component {

  static propTypes = {

  };

  renderList() {
    const list = this.props.list;

    return Object.keys(list).map((key, i) => {
      return <Todo key={i} todo={list[key]} />;
    });
  }

  render() {
    return (
      <ol className='list'>
        {::this.renderList()}
      </ol>
    );
  }
}
