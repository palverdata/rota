# Build and push the frontend Docker image to DockerHub
# Image: palverdata/rota_front:latest

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir

Write-Host "Building frontend Docker image..."
docker build -t palverdata/rota_front:latest -f "$RepoRoot\dashboard\Dockerfile" "$RepoRoot\dashboard"

Write-Host "Pushing frontend Docker image to DockerHub..."
docker push palverdata/rota_front:latest

Write-Host "Done! Image palverdata/rota_front:latest has been built and pushed."
