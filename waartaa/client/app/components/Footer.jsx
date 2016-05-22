import React, {Component, PropTypes } from 'react';

import {Icon} from 'react-fa';

import footer from '../stylesheets/drawer.less'

export default class DrawerFooter extends Component {
    render() {
        return (
            <div className="d-footer">
                Sign In <Icon name="sign-in" />
            </div>
        );
    }
}
