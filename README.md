# waartaa

A web IRC client written in Meteor JS. It is aimed towards being an intuitive, collaborative IRC client across
multiple devices of the user along with centralized logging.


## Setup

1. Get the source: ``$ git clone --recursive https://github.com/waartaa/waartaa.git``
1. Install system dependencies: ``node``, ``npm`` for your system. For example:
    1. For Fedora, you can do:

    ```
    $ sudo yum install nodejs npm -y
    ```

    1. For Mac OS X, you can install them via brew:

    ```
    $ brew install node npm
    ```

    1. Else, you can always compile from source.

1. Go to ``waartaa``'s directory: ``$ cd waartaa``
1. Run setup script: ``$ ./setup.sh``
1. Customize ``waartaa/waartaa/server/settings-local.js`` as needed.
1. Run waartaa: ``$ meteor``


## Running with Meteor 0.7 Mongo OPLOG support

1. ``meteor update``
1. ``mongod [--dbpath <path_to_db>] --replSet meteor``
1. Open mongo shell by typing ``mongo`` in your shell and then enter the
   following:

   ```
   var config = {_id: "meteor", members: [{_id: 0, host: "127.0.0.1:27017"}]}
   rs.initiate(config)
   ```

1. Then export the following variables:

   ```
   export MONGO_URL=mongodb://localhost:27017/meteor
   export OPLOG_URL=mongodb://localhost:27017/local
   ```

1. Run meteor as usual: ``meteor`` or ``mrt``

