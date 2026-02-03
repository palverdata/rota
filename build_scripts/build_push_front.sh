#!/bin/bash

# Build and push the frontend Docker image to DockerHub
# Image: palverdata/rota_front:latest

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Building frontend Docker image..."
docker build -t palverdata/rota_front:latest -f "$REPO_ROOT/dashboard/Dockerfile" "$REPO_ROOT/dashboard"

echo "Pushing frontend Docker image to DockerHub..."
docker push palverdata/rota_front:latest

echo "Done! Image palverdata/rota_front:latest has been built and pushed."
