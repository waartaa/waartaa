# Deploy waartaa

This directory contains ansible scripts necessary to
deploy waartaa.

## Setup

```bash
cp hosts hosts.local
# Customize hosts.local as required

cp group_vars/all-dist group_vars/all
# Customize group_vars/all as required

cp roles/app_deploy/vars/main.yml-dist roles/app_deploy/vars/main.yml
# Customize roles/app_deploy/vars/main.yml as required

cp extra_node_deps.json-dist extra_node_deps.json
# Customize extra_node_deps.json as needed
```

## Usage

```bash
# Bundle waartaa for deployment
./bundle

# deploy current waartaa bundle
ansible-playbook -i hosts.local deploy.yml
```
