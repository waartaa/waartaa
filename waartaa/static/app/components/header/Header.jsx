import React, {Component, PropTypes} from 'react';

class Header extends Component {
  getTitle() {
    return 'waartaa';
  }

  render() {
    return (
        <div className="masthead">
          <div className="container">
            <div className="col-sm-3">
              <h1>{this.getTitle()}</h1>
            </div>
          </div>
        </div>
    )
  }
}

export default Header;
