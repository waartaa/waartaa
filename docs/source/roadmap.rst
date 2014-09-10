Roadmap
=======

HTML5 mobile interface for Waartaa
----------------------------------

Implement a mobile optimized client for Waartaa. This will basically be
a web app which can run on mobile browser, Firefox OS, as a native app (
using Phonegap) as well. Some major differences of the mobile web app from
the desktop web app will be:

- **Less subscriptions to data**. Subscribe for data elements which need to
  be rendered in the UI.
- **On demand loading of data**. This will take some time, but it will be
  memory savvy.

Build APIs, bots for seamless 3rd party integration
---------------------------------------------------

Integration with 3rd party services like Bugzilla, git (and other VCS), trac,
etc. have always existed in the IRC world, using bots. However, there are
some common steps involved:

- Write code for the bot, if someone hasn't already done it
- Run the bot in a server
- Monitor and maintain it

We want to make this process simpler by allowing one click setup of a channel
bot with optional integration to 3rd party services supported by Waartaa. We
also need to come up with a friendly API to empower the community to
integrate a new service with Waartaa.

Enable scaling Waartaa
----------------------

Currently, Waartaa is made to run on a single server only. We need to
separate the layers: application, IRC, etc. and run them as different
processes in the same or different machines. This will help us to have
NxM combination of application and IRC servers, and will help us balance
the load on Waartaa. Also, optimization will be needed at the database layer
to handle increased writes and reads.

Improve on audio/video communication integration done during GSoC
-----------------------------------------------------------------

It's in our tasklist to do a basic integration of audio/video communication
using WebRTC during GSoC 2014. However, we need to revisit this feature
and improve it to make it usable by loads of users of Waartaa.

Easy setup and deployment
-------------------------

Write scripts, and package Waartaa for easy setup and deployment of Waartaa.

Distributed log storage
-----------------------

Allow users to share space from their cloud storage (Dropbox, Google drive,
etc.) where Waartaa can dump their logs into small files. The data from these
files can be viewed from Waartaa from the log browser. This distributed 
storage model will allow Waartaa service providers to operate with less
server storage without compromising on the realtime nature of Waartaa. It
will not be easy for users to search through all logs at once, but Waartaa
will put its best efforts to perform as much as possible in limited resources
too.

Encrypt private user logs
-------------------------

Give the user option to for encrypted storage of private chat logs in the
server. This will come with some trade off for servr side search in the
encrypted logs. But, this is a price one may be willing to pay for privacy.
Waartaa aims at providing options to the user to take ownership of their
data.

Secure authentication with IRC servers
--------------------------------------

IRC servers do authentication with raw text passwords. That's why, we do not
store NickServ passwords in Waartaa at this moment. However, it's not at all
user friendly to authenticate manually to IRC servers everytime a user joins
a server. Waartaa needs to figure out a way to store user passwords in a safe
way so that admins of the Waartaa service don't have a way to pick into
user's IRC passwords from the database or the system.

Wizard to help new users get started
------------------------------------

One of the shortcoming with the current IRC tools is that they require some
learning curve to get started with. People who come to IRC thinking it to
be just another chatting client are often confused. They don't know where
to go and how to talk nicely on IRC.

So, we plan to implement a wizard for new users to guide them to proper IRC
channels based on their area of interest. Initially, this will be only for
popular open source project. We'll keep a very simple way for the community
to add content for the wizard. This is inspired by
`http://www.whatcanidoformozilla.org/ <http://www.whatcanidoformozilla.org/>`_.

API to export logs
------------------

An API to export chat logs. Using this API, convertors can be built for
chat logs to make it compatible with the popular IRC clients.

Friend finder
-------------

It's more natural to communicate with friends on Google Hangout, Facebook
Chat, etc. rather than find a nick in an IRC channel. Waartaa wants to add
a personal touch to IRC, if the user desires so. A user will be allowed to
follow (identified) channel nicks. If the other nick is also using Waartaa,
he/she can choose to follow the follower as well. That's how two users become
friends on Waartaa. Users will be able to see a list of people they follow
who are online and can directly initiate chat with them irrespective of
an IRC server or channel.

Improve UX
----------

- *keyboard shortcuts for navigation*

Many people love to use the keyboard for UI navigation. Inspired by the
'Ctrl + p' (or 'Cmd + p') keyboard shortcut in SublimeText, we'd like to
implement a similar feature (along with other necessary keyboard shortcuts)
to provide a quick and easy way to navigate through the UI of Waartaa.

- *customizable color schemes*

IRC users spend a significant amount of time on IRC. So, if text editors
like vim, emacs, sublime text has the option of color themes, then why
should not an IRC client. Waartaa plans to implement various color themes
to soothe the eyes for long working hours. Adding a color theme will be
quick and simple: a few CSS rules. A user should be able to apply a custom
theme from the client side itself, without requiring any server change.

- *In page integration with paste services like gist, pastebin, etc.*

IRC etiquettes include that anybody should not paste multiple lines
into the channel. It is considered spamming. So most of the people
resort to pastebin/Github gist to sort out the problem. At Waartaa, we
want to give the user an option to upload a file or scribble some text
or code in an in page text editor (powered by Ace text editor), and Waartaa
will upload the data to some public paste services like pastebin, Github
gist, etc. and send the link generated as a chat message. This will save a
significant amount of time for the user.

- *UI endpoint for most IRC (server) actions*

Waartaa aims to provide UI endpoints for various common IRC actions like
becoming operator, releasing operator status, kicking or banning a nick,
editing channel topic message, etc.

- *Autocomplete IRC (server) commands, along with commands cheat list*
