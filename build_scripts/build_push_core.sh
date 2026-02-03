#!/bin/bash

# Build and push the core Docker image to DockerHub
# Image: palverdata/rota_core:latest

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Building core Docker image..."
docker build -t palverdata/rota_core:latest -f "$REPO_ROOT/core/Dockerfile" "$REPO_ROOT/core"

echo "Pushing core Docker image to DockerHub..."
docker push palverdata/rota_core:latest

echo "Done! Image palverdata/rota_core:latest has been built and pushed."
