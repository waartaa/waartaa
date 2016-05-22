import React, {Component, PropTypes } from 'react';

import {Icon} from 'react-fa';

export default class DrawerFooter extends Component {
    render() {
        return (
            <div class="footer">
                Sign In <Icon name="sign-in" />
            </div>
        );
    }
}
