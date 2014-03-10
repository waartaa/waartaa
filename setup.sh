#!/bin/sh

# Install meteor
curl https://install.meteor.com | /bin/sh

# Install meteorite
sudo -H npm install -g meteorite

# Install node modules
npm install

# Change to the meteor project waartaa directory
cd waartaa

# Install meteorite dependencies
mrt install

# Copy and configure settings
cp server/settings-local.js-dist server/settings-local.js

# Go back to root dir
cd ..

# Customize settings-local.js as required with your favourite text editor

# Run meteor
# meteor

