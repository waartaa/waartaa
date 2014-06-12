#!/bin/sh

# Install meteor
echo "Installing Meteor..."
curl https://install.meteor.com | /bin/sh

# Install meteorite
echo "Installing Meteorite..."
sudo -H npm install -g meteorite

# Install node modules
echo "Installing Node modules..."
npm install

# Change to the meteor project waartaa directory
cd app

# Install meteorite dependencies
echo "Installing meteorite dependencies"
mrt install

# Copy and configure settings
echo "Copying settings-local.js"
cp server/settings-local.js-dist server/settings-local.js

# Go back to root dir
cd ..

echo "$(tput setab 1)Note:$(tput sgr 0) Customize settings-local.js as required with your favourite text editor"
# Customize settings-local.js as required with your favourite text editor

# Run meteor
# meteor

