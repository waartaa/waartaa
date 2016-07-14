# -*- coding: utf-8 -*-

import asyncio
import json
import os

from autobahn.asyncio.websocket import WebSocketServerProtocol, \
    WebSocketServerFactory
import logging

from ircb.storeclient import UserStore
from ircb.publishers import (MessageLogPublisher,
                             NetworkPublisher,
                             ChannelPublisher)


class ServerProtocol(WebSocketServerProtocol):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.log = logging.getLogger()
        self.publishers = set()

    def onConnect(self, request):
        self.request = request

    def onOpen(self):
        self.log.info('Connection opened')

    def onMessage(self, payload, isBinary):
        self.log.info(payload)
        if isBinary:
            return

        action = json.loads(payload.decode('utf-8'))

        callback = getattr(self, 'on_' + action['type'], None)
        if callback:
            asyncio.Task(callback(action['data']))

    @asyncio.coroutine
    def on_login(self, data):
        print('login data: {0}'.format(data))
        user = yield from UserStore.get(
            dict(query=('auth', (data['username'], data['password'])))
        )
        if user:
            self.user = user
            response = {'type': 'loggedin', 'data': {'status': 'SUCCESS'}}
            self.sendMessage(json.dumps(response).encode('utf-8'))

    @asyncio.coroutine
    def on_subscribe_networks(self, data):
        if self.user is None:
            return
        publisher = NetworkPublisher(self.user.id)

        def on_create(data):
            action = {
                'type': 'networks_created',
                'id': publisher.id,
                'data': data
            }
            self.sendMessage(json.dumps(action).encode('utf-8'))

        def on_fetch(data):
            action = {
                'type': 'networks_fetched',
                'id': publisher.id,
                'data': data
            }
            self.sendMessage(json.dumps(action).encode('utf-8'))

        def on_update(data):
            action = {
                'type': 'networks_updated',
                'id': publisher.id,
                'data': data
            }
            self.sendMessage(json.dumps(action).encode('utf-8'))

        publisher.on('create', on_create)
        publisher.on('fetch', on_fetch)
        publisher.on('update', on_update)

        publisher.run()

    @asyncio.coroutine
    def on_subscribe_channels(self, data):
        if self.user is None:
            return
        if 'network_id' in data:
            publisher = ChannelPublisher(self.user.id, data['network_id'])
        else:
            publisher = ChannelPublisher(self.user.id)

        def on_create(data):
            action = {
                'type': 'channels_created',
                'id': publisher.id,
                'data': data
            }
            self.sendMessage(json.dumps(action).encode('utf-8'))

        def on_fetch(data):
            action = {
                'type': 'channels_fetched',
                'id': publisher.id,
                'data': data
            }
            self.sendMessage(json.dumps(action).encode('utf-8'))

        def on_update(data):
            action = {
                'type': 'channels_updated',
                'id': publisher.id,
                'data': data
            }
            self.sendMessage(json.dumps(action).encode('utf-8'))

        publisher.on('create', on_create)
        publisher.on('fetch', on_fetch)
        publisher.on('update', on_update)

        publisher.run()

    @asyncio.coroutine
    def on_subscribe_chat_message_logs(self, data):
        if self.user is None:
            return
        publisher = MessageLogPublisher(data['hostname'], data['roomname'],
                                        self.user.id)

        def on_create(data):
            action = {
                'type': 'chat_message_logs_created',
                'id': publisher.id,
                'data': data
            }
            self.sendMessage(json.dumps(action).encode('utf-8'))

        def on_fetch(data):
            action = {
                'type': 'chat_message_logs_fetched',
                'id': publisher.id,
                'data': data
            }
            self.sendMessage(json.dumps(action).encode('utf-8'))

        def on_update(data):
            action = {
                'type': 'chat_message_logs_updated',
                'id': publisher.id,
                'data': data
            }
            self.sendMessage(json.dumps(action).encode('utf-8'))

        publisher.on('create', on_create)
        publisher.on('fetch', on_fetch)
        publisher.on('update', on_update)

        publisher.run()

    def onClose(self, wasClean, code, reason):
        self.log.info('Websocket connection closed: {0}'.format(reason))


def run():
    from ircb.storeclient import initialize
    from ircb.utils.config import load_config
    load_config()
    initialize()
    host = os.environ.get('HOST') or '127.0.0.1'
    port = os.environ.get('PORT') or 9999
    factory = WebSocketServerFactory(
        'ws://{host}:{port}'.format(host=host, port=port))
    factory.protocol = ServerProtocol

    loop = asyncio.get_event_loop()
    coro = loop.create_server(factory, host, port)
    server = loop.run_until_complete(coro)

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.close()
        loop.close()

if __name__ == '__main__':
    run()
