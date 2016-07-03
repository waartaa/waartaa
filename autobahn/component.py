import asyncio
import logging

from autobahn.asyncio.wamp import ApplicationSession, ApplicationRunner
from autobahn.wamp.exception import ApplicationError

from ircb.publishers import MessageLogPublisher


class AppSession(ApplicationSession):

    log = logging.getLogger()

    def onJoin(self, details):

        def on_fetch(data):
            self.log.info('on fetch: {data}'.format(data=data))
            self.publish('waartaa.room.message.fetch', data)

        def on_create(data):
            self.log.info('on create: %s' % data)
            self.publish('waartaa.room.message.create', data)

        def on_update(data):
            self.log.info('on update: %s' % data)
            self.publish('waartaa.room.message.update', data)

        publisher = MessageLogPublisher('irc.freenode.net', '#bcrec', 1)
        publisher.on('create', on_create)
        publisher.on('update', on_update)
        publisher.on('fetch', on_fetch)
        publisher.run()

if __name__ == '__main__':
    from ircb.storeclient import initialize
    from ircb.utils.config import load_config
    load_config()
    initialize()
    runner = ApplicationRunner(url=u'ws://localhost:8080/ws', realm='realm1')
    runner.run(AppSession)
