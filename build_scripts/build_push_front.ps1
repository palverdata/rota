# Build and push the frontend Docker image to DockerHub
# Image: palverdata/rota_front:latest
#
# Usage: .\build_push_front.ps1 [API_URL]
# Example: .\build_push_front.ps1 http://116.203.126.162:8001

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir

# Default API URL if not provided
$ApiUrl = if ($args[0]) { $args[0] } else { "http://localhost:8001" }

Write-Host "Building frontend Docker image with NEXT_PUBLIC_API_URL=$ApiUrl..."
docker build `
    --build-arg NEXT_PUBLIC_API_URL="$ApiUrl" `
    -t palverdata/rota_front:latest `
    -f "$RepoRoot\dashboard\Dockerfile" `
    "$RepoRoot\dashboard"

Write-Host "Pushing frontend Docker image to DockerHub..."
docker push palverdata/rota_front:latest

Write-Host "Done! Image palverdata/rota_front:latest has been built and pushed."
