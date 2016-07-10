import React from 'react';

import PageTitle from '../../components/app/PageTitle.jsx';
import SocialButtons from '../../components/social/SocialButtons.jsx';

import LoginController from '../../containers/login/LoginController.jsx';

export default class RootPageContainer extends React.Component {
  constructor(props) {
    super(props);
  }
  render () {
    return (
      <div>
        <PageTitle />
        <SocialButtons />
        <LoginController />
      </div>
    );
  }
}
