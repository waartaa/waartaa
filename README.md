# waartaa

A web IRC client written in Meteor JS. It is aimed towards being an intuitive, collaborative IRC client across
multiple devices of the user along with centralized logging.


## Setup

- Install system dependencies: ``node``, ``npm`` for your system. For example:
    - For Fedora, you can do: ``$ sudo yum install nodejs npm -y``
    - For Mac OS X, you can install them via brew: ``$ brew install node npm``
    - For Debian/Ubuntu install only node.js and it will include npm as: 
                                           ``sudo add-apt-repository ppa:chris-lea/node.js
                                             sudo apt-get update
                                             sudo apt-get install nodejs``
    - Else, you can always compile from source.
- Get the source: ``$ git clone --recursive https://github.com/waartaa/waartaa.git``
- Go to **waartaa**'s repository directory just cloned: ``$ cd waartaa``
- Run setup script: ``$ ./setup.sh``
- Customize ``waartaa/app/server/settings-local.js`` as needed.
  - disable elasticsearch (set to ``false``) if its not setup.
- Go to waartaa meteor project's directory: ``$ cd app``
- update the app ``$ mrt update && meteor update``
- Add kadira to meteor ``$ mrt add kadira``
- Run waartaa: ``$ meteor``
- If you get a "blaze" error, run ``$ mrt uninstall blaze`` and re run the above step.

## Advanced

### Running with OPLOG database driver of Meteor 0.7

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
   export MONGO_OPLOG_URL=mongodb://localhost:27017/local
   ```

1. Run meteor as usual: ``meteor``

### Deployment

1. Install ``ansible`` for your distribution.
   - Fedora (or CentOS): ``sudo yum install ansible``
   - Ubuntu: ``sudo apt-get install ansible``
1. ``cd deploy``
1. Copy ``hosts`` to say ``hosts.local`` and customize as needed.
1. Provision and deploy: ``./bundle; ansible-playbook -i hosts.local site.yml``
1. Only deploy: ``./bundle; ansible-playbook -i hosts.local site.yml``


## Contribute

1. Setup and run **waartaa** locally.
2. Report bugs or submit feature requests at https://github.com/waartaa/waartaa/issues/new.
3. Feel free to pick up open issues from https://github.com/waartaa/waartaa/issues?state=open. Don't hesitate to ask for help.


## Comunicate

1. Mailing list: https://groups.google.com/forum/#!forum/waartaa
1. IRC: **#waartaa** on Freenode



[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/waartaa/waartaa/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

