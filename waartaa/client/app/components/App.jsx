import React from 'react';
import { Link } from 'react-router';
import Note from './Note.jsx';

export default class App extends React.Component {
  render() {
    return (
      <div>
        <Link to="/home">Home</Link>
        <Note />
      </div>
    );
  }
}
