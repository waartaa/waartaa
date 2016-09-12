# waartaa

A web IRC client written on top of React and Pyramid. It is aimed towards being an intuitive, collaborative IRC client across
multiple devices of the user along with centralized logging.

## System dependencies

```
# Dependency for crossbar
sudo dnf install -y libsodium libsodium-devel
```

## Development

* Install the system-level dependencies  
``sudo dnf install python-virtualenvwrapper libsodium libsodium-devel``

* Create a virtualenv  
``mkvirtualenv waartaa``

* Install the required packages  
``pip install -r dev_requirements.txt``

* Waartaa runs on top of ircb. So follow the
  [instructions](https://github.com/waartaa/ircb#setup) to setup ircb.

* Run the ircb stores  
``IRCB_SETTING=ircb.settings.py ircb run server -m allinone --port 9999``

* Run the development server  
``python waartaa/app.py``

* Move to a different terminal and start  
``cd waartaa/client/``

* Build JS assests  
``npm start``

## Contribute

1. Setup and run **waartaa** locally.
2. Report bugs or submit feature requests at https://github.com/waartaa/waartaa/issues/new.
3. Feel free to pick up open issues from https://github.com/waartaa/waartaa/issues?state=open. Don't hesitate to ask for help.


## Comunicate

1. Mailing list: https://groups.google.com/forum/#!forum/waartaa
1. IRC: **#waartaa** on Freenode
