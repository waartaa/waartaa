# Meteor Presence

A very simple presence package, to track who's online, etc.

## Installation

``` sh
$ meteor add tmeasday:presence
```

## Usage

Once added to your project, a new Meteor collection called `Presences` is available.

All active connections are then stored in this collection. A presence document from an authenticated user will contain their user id on the `userId` field.

NOTE: The package doesn't publish the presences by default, you'll need to do something like:
```js
Meteor.publish('userPresence', function() {
  // Setup some filter to find the users your user
  // cares about. It's unlikely that you want to publish the 
  // presences of _all_ the users in the system.
  
  // If for example we wanted to publish only logged in users we could apply:
  // filter = { userId: { $exists: true }};
  var filter = {}; 
  
  return Presences.find(filter, { fields: { state: true, userId: true }});
});
```

And of course, don't forget to subscribe.

```js
Meteor.subscribe('userPresence');
```

## State function

If you want to track more than just users' online state, you can set a custom state function. (The default state function returns just `'online'`):

```js
// Setup the state function on the client
Presence.state = function() {
  return {
    currentRoomId: Session.get('currentRoomId')
  };
}
```

Now we can simply query the collection to find all other users that share the same currentRoomId

```js
Presences.find({ state: { currentRoomId: Session.get('currentRoomId') }});
```

Of course Presence will call your function reactively, so everyone will know as soon as things change.

## Contributing

Please! The biggest thing right now is figuring how to write tests.

## License

MIT
