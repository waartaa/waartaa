import React from 'react';
import ChatMenu from './ChatMenu';
import ChatRoom from './ChatRoom';

var ChatApp = React.createClass({
    render: function() {
        return <div>
            <ChatMenu />
            <ChatRoom />
        </div>
    }
})

module.exports = ChatApp;