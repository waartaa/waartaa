import React from 'react';

import IconButton from 'material-ui/IconButton';

export default class SocialButtons extends React.Component {
  render() {
    return (
      <div>
        <IconButton
          className="muidocs-icon-custom-github"
          tooltip="Github"
          tooltipPosition="top-center"
        />
        <IconButton
          className="muidocs-icon-custom-facebook"
          tooltip="Facebook"
          tooltipPosition="top-center"
        />
      </div>
    )
  }
}
