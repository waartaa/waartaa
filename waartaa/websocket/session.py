# -*- coding: utf-8 -*-
import asyncio
import json
import sockjs

from ircb.storeclient import UserStore
from ircb.publishers import (NetworkPublisher,
                             ChannelPublisher,
                             MessageLogPublisher)


class SockjsSessionHandler(object):

    def __init__(self, session):
        self.session = session

    def on_message(self, message):
        try:
            action = json.loads(message)

            callback = getattr(self, 'on_' + action['type'], None)
            if callback:
                asyncio.Task(callback(action['data']))
        except Exception as e:
            print('Unable to handle message: {}'.format(message))
            self.session.send(message)

    @asyncio.coroutine
    def on_login(self, data):
        print('login data: {0}'.format(data))
        user = yield from UserStore.get(
            dict(query=('auth', (data['username'], data['password'])))
        )
        if user:
            self.user = user
            response = {'type': 'loggedin', 'data': {'status': 'SUCCESS'}}
            self.session.send(json.dumps(response))

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
            self.session.send(json.dumps(action))

        def on_fetch(data):
            action = {
                'type': 'networks_fetched',
                'id': publisher.id,
                'data': data
            }
            self.session.send(json.dumps(action))

        def on_update(data):
            action = {
                'type': 'networks_updated',
                'id': publisher.id,
                'data': data
            }
            self.session.send(json.dumps(action))

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
            self.session.send(json.dumps(action))

        def on_fetch(data):
            action = {
                'type': 'channels_fetched',
                'id': publisher.id,
                'data': data
            }
            self.session.send(json.dumps(action))

        def on_update(data):
            action = {
                'type': 'channels_updated',
                'id': publisher.id,
                'data': data
            }
            self.session.send(json.dumps(action))

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
            self.session.send(json.dumps(action))

        def on_fetch(data):
            action = {
                'type': 'chat_message_logs_fetched',
                'id': publisher.id,
                'data': data
            }
            self.session.send(json.dumps(action))

        def on_update(data):
            action = {
                'type': 'chat_message_logs_updated',
                'id': publisher.id,
                'data': data
            }
            self.session.send(json.dumps(action))

        publisher.on('create', on_create)
        publisher.on('fetch', on_fetch)
        publisher.on('update', on_update)

        publisher.run()


class SockjsSessionHandlerFactory(object):

    _handlers = {}

    @classmethod
    def get(self, session):
        return self._handlers.get(session.id)

    @classmethod
    def create(self, session):
        handler = self._handlers.get(session.id)
        if handler is None:
            handler = SockjsSessionHandler(session)
            self._handlers[session.id] = handler
        return handler

    @classmethod
    def remove(self, session):
        self._handlers.pop(session.id, None)
