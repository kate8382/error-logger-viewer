#!/bin/bash
# Build and start the production container
docker compose -f docker/docker-compose.yml down --remove-orphans
docker compose -f docker/docker-compose.yml up --build
