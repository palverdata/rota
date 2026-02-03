# Build and push the core Docker image to DockerHub
# Image: palverdata/rota_core:latest

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir

Write-Host "Building core Docker image..."
docker build -t palverdata/rota_core:latest -f "$RepoRoot\core\Dockerfile" "$RepoRoot\core"

Write-Host "Pushing core Docker image to DockerHub..."
docker push palverdata/rota_core:latest

Write-Host "Done! Image palverdata/rota_core:latest has been built and pushed."
