#!/bin/bash
# Build and start the development containers
docker compose -f docker-compose.dev.yml down --remove-orphans
docker compose -f docker-compose.dev.yml up --build
