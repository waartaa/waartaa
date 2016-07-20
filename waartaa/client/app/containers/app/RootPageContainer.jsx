import React from 'react';

import PageTitle from '../../components/app/PageTitle.jsx';
import SocialButtons from '../../components/social/SocialButtons.jsx';

import LoginController from '../../containers/login/LoginController.jsx';

export default class RootPageContainer extends React.Component {
  constructor(props) {
    super(props);
  }

  getStyles = () => {
    const styles = {
      rightContainer : {
        paddingLeft: 20,
      }
    }
    return styles;
  }

  render = () => {
    const styles = this.getStyles();

    return (
      <div style={styles.rightContainer}>
        <PageTitle />
        <LoginController />
      </div>
    );
  }
}
