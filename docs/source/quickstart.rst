Quickstart
==========

Development
-----------

.. code-block:: bash

    curl https://install.meteor.com/ | sh
    git clone https://github.com/waartaa/waartaa.git
    cd waartaa
    npm install collections
    cd app
    cp server/settings-local.js-dist server/settings-local.js
    meteor



Deployment
----------

.. note::
    Currently deployment scripts are for only Fedora/CentOS/RHEL servers.
    Any Ubuntu/Debian fan is welcome to contribute to extend the
    deployment scripts to cover Ubuntu/Debian servers as well.

1. Setup development environment as mentioned above.
2. Install ansible:

   - Fedora/CentOS/RHEL: ``sudo yum install ansible``
   - Ubuntu/Debian: ``sudo apt-get install ansible``
   - Python pip: ``sudo pip install ansible``
3. Copy ``provisions/hosts.sample`` file to, let's say, ``provisions/hosts``
   and customize it as needed.
4. Configure SSH access and firewall in your servers as needed.
5. Setup servers, build and deploy waartaa:
   ``ansible -i provisions/hosts provisions/deploy.yml``

