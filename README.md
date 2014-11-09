# waartaa

A web IRC client written in Meteor JS. It is aimed towards being an intuitive, collaborative IRC client across
multiple devices of the user along with centralized logging.


## Setup

1. Install system dependencies: ``node``, ``npm`` for your system. For example:
    1. For Fedora, you can do: ``$ sudo yum install nodejs npm -y``
    1. For Mac OS X, you can install them via brew: ``$ brew install node npm``
    1. For Debian/Ubuntu install only node.js and it will include npm as:
                                           ``sudo add-apt-repository ppa:chris-lea/node.js
                                             sudo apt-get update
                                             sudo apt-get install nodejs``
    1. Else, you can always compile from source.
1. Get the source: ``$ git clone --recursive https://github.com/waartaa/waartaa.git``
1. Go to **waartaa**'s repository directory just cloned: ``$ cd waartaa``
1. Run setup script: ``$ ./setup.sh``
1. Go to waartaa meteor project's directory: ``$ cd app``
1. Customize ``server/settings-local.js`` as needed.
1. Run waartaa: ``$ meteor``


## Deploy

*The following steps assumes that you have already run the above mentioned
setup process.*

1. Install ansible:

   - Fedora/CentOS: ``sudo yum install ansible``
   - Ubuntu: ``sudo apt-get install ansible``
   - Python pip: ``sudo pip install ansible``
1. Copy the sample inventory file ``provisions/hosts.sample`` to
   say ``provisions/hosts`` and customize as needed. You can override
   the default variables for various ansible roles in the inventory
   file.
1. Setup and configure SSH, firewall in your servers as needed.
1. Deploy waartaa: ``ansible-playbook -i provisions/hosts provisions/deploy.yml``

This will setup a working instance of waartaa in your servers. The nodejs
app deployed in your application servers and mongodb in your database servers.

If you want to do a quick deployment of only the app, you can do this
using:

``ansible-playbook -i provisions/hosts deploy.yml --tags "app_deploy"``


## Contribute

1. Setup and run **waartaa** locally.
2. Report bugs or submit feature requests at https://github.com/waartaa/waartaa/issues/new.
3. Feel free to pick up open issues from https://github.com/waartaa/waartaa/issues?state=open. Don't hesitate to ask for help.


## Comunicate

1. Mailing list: https://groups.google.com/forum/#!forum/waartaa
1. IRC: **#waartaa** on Freenode



[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/waartaa/waartaa/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

