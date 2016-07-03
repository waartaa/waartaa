import asyncio
import logging

from autobahn.asyncio.wamp import ApplicationSession, ApplicationRunner


class Subscriber(ApplicationSession):

    log = logging.getLogger()

    def onJoin(self, details):

        def on_create(data):
            self.log.info('on fetch: %s' % data)

        yield from self.subscribe(on_create, 'waartaa.room.message.create')

if __name__ == '__main__':
    runner = ApplicationRunner(url=u'ws://localhost:8080/ws', realm='realm1')
    runner.run(Subscriber)
