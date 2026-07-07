# MAG7 Daily Returns - monorepo task runner.
# Run `just` (or `just --list`) to see all available recipes.

set shell := ["bash", "-euo", "pipefail", "-c"]

api_dir := "apps/api-service"
web_dir := "apps/web-client"
sdk_dir := "libs/sdk"
venv := api_dir / ".venv"
venv_bin := venv / "bin"
openapi_json := sdk_dir / "openapi.json"

# List available recipes (default).
default:
    @just --list

# Setup the development environment by installing all required dependencies for both the frontend web client and the backend API service.
setup: install-py
  @echo "--------------------------------------------------"
  @echo "Installing NPM packages for the frontend web client"
  @echo "--------------------------------------------------"
  @cd apps/web-client && npm install

# Create the Python virtualenv (if needed) and install API dependencies.
install-py:
    @echo "==> Installing Python API dependencies"
    [ -d "{{venv}}" ] || python -m venv "{{venv}}"
    "{{venv_bin}}/python" -m pip install --quiet --upgrade pip
    "{{venv_bin}}/pip" install --quiet -r "{{api_dir}}/requirements.txt" -r "{{api_dir}}/requirements-dev.txt"

# Generate the SDK from the backend OpenAPI specification and bundle the frontend web client for deployment.
build-sdk:
  @echo "--------------------------------------------------"
  @echo "Building SDK from the backend OpenAPI specification"
  @echo "--------------------------------------------------"
  @echo "\nTODO: Install and run an OpenAPI Generator to build the SDK"

build-web: build-sdk
  @echo "--------------------------------------------------"
  @echo "Bundling the frontend web client for Deployment"
  @echo "--------------------------------------------------"
  @cd apps/web-client && npm run build

# Deploy both the API service and the web client in parallel with live-reload enabled for development purposes.
[parallel]
develop: develop-api develop-web

develop-api:
  @echo "--------------------------------------------------"
  @echo "Deploying the api service with live-reload enabled"
  @echo "--------------------------------------------------"
  @cd apps/api-service && fastapi dev main.py

develop-web: build-sdk
  @echo "--------------------------------------------------"
  @echo "Deploying the web client with live-reload enabled"
  @echo "--------------------------------------------------"
  @cd apps/web-client && npm run dev

# Deploy both the API service and the web client in parallel for production purposes.
[parallel]
deploy: deploy-api deploy-web

deploy-api:
  @echo "--------------------------------------------------"
  @echo "Deploying the api service"
  @echo "--------------------------------------------------"
  @cd apps/api-service && fastapi run main.py

deploy-web: build-web
  @echo "--------------------------------------------------"
  @echo "Deploying the web client from the build artifacts"
  @echo "--------------------------------------------------"
  @echo "\nTODO: Replace 'dev' with actual deployment commands"
  @cd apps/web-client && npm run dev

# Run all test suites.
test-all: test-api

test-api:
    @echo "==> API tests (pytest)"
    cd "{{api_dir}}" && .venv/bin/pytest

lint:
  @echo 'WARNING: No lint scripts have been implemented yet.'

format:
  @echo 'WARNING: No format scripts have been implemented yet.'

ci:
  @echo 'WARNING: No CI scripts have been implemented yet.'