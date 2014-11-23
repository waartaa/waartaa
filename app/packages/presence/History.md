## v0.4.8

* Slight refactor. Fixed an issue with userId remaining on sign-out

## v0.4.7

* onConnection no longer appears to fire on login/logout
  replaced upsert with insert and in turn fixed issue #9

## v0.4.5

* Simulate updatePresence method on the client so that we get latency compensation

## v0.4.4

* Check that Meteor.userId function is defined on the client
  as it won't exist if an accounts package isn't in use

## v0.4.3

* Fixes a bug with userId not getting set reactively

## v0.4.1

* Fixes a bug, Error on `meteor reset`

## v0.4.0 - 2013-12-01

* Complete rewrite to make use of livedata
