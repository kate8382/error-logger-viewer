#!/bin/bash
# Build and start the production container
docker compose down --remove-orphans
docker compose up --build
