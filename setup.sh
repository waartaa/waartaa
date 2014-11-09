#!/bin/sh

# Install meteor
echo "Installing Meteor..."
curl https://install.meteor.com | /bin/sh

# Install node modules
echo "Installing Node modules..."
npm install

# Change to the meteor project waartaa directory
cd app

# Copy and configure settings
echo "Copying settings-local.js"
cp server/settings-local.js-dist server/settings-local.js

# Go back to root dir
cd ..

# Customize settings-local.js as required with your favourite text editor
echo "$(tput setab 1)Note:$(tput sgr 0) Customize settings-local.js as required with your favourite text editor"

# Run meteor
echo "$(tput setab 1)Note:$(tput sgr 0) cd app; meteor"

