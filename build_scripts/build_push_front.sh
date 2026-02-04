#!/bin/bash

# Build and push the frontend Docker image to DockerHub
# Image: palverdata/rota_front:latest
#
# Usage: ./build_push_front.sh [API_URL]
# Example: ./build_push_front.sh http://116.203.126.162:8001

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Default API URL if not provided
API_URL="${1:-http://localhost:8001}"

echo "Building frontend Docker image with NEXT_PUBLIC_API_URL=$API_URL..."
docker build \
    --build-arg NEXT_PUBLIC_API_URL="$API_URL" \
    -t palverdata/rota_front:latest \
    -f "$REPO_ROOT/dashboard/Dockerfile" \
    "$REPO_ROOT/dashboard"

echo "Pushing frontend Docker image to DockerHub..."
docker push palverdata/rota_front:latest

echo "Done! Image palverdata/rota_front:latest has been built and pushed."
