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

# ----------------------------------------------------------------------------
# Setup
# ----------------------------------------------------------------------------

# Install all dependencies (JS workspaces + Python venv) and build the SDK.
setup: install-js install-py build-sdk
    @echo
    @echo "Setup complete. Run 'just develop' to start the app."

# Install the frontend + SDK workspaces from the repo root.
install-js:
    @echo "==> Installing JS workspaces (web-client + sdk)"
    npm install

# Create the Python virtualenv (if needed) and install API dependencies.
install-py:
    @echo "==> Installing Python API dependencies"
    [ -d "{{venv}}" ] || python -m venv "{{venv}}"
    "{{venv_bin}}/python" -m pip install --quiet --upgrade pip
    "{{venv_bin}}/pip" install --quiet -r "{{api_dir}}/requirements.txt" -r "{{api_dir}}/requirements-dev.txt"

# ----------------------------------------------------------------------------
# SDK
# ----------------------------------------------------------------------------

# Export the backend OpenAPI schema to libs/sdk/openapi.json (no server needed).
openapi:
    @echo "==> Exporting OpenAPI schema"
    "{{venv_bin}}/python" "{{api_dir}}/scripts/export_openapi.py" "{{openapi_json}}"

# Regenerate the typed SDK from the OpenAPI schema and compile it.
build-sdk: openapi
    @echo "==> Generating and building the SDK"
    npm run generate --workspace @acadian/sdk
    npm run build --workspace @acadian/sdk

# ----------------------------------------------------------------------------
# Build
# ----------------------------------------------------------------------------

# Build the frontend for production (rebuilds the SDK first).
build-web: build-sdk
    @echo "==> Building the web client"
    npm run build --workspace @acadian/web-client

# Build everything.
build: build-sdk build-web

# ----------------------------------------------------------------------------
# Develop (live reload)
# ----------------------------------------------------------------------------

# Run the API and web client together with live reload.
[parallel]
develop: develop-api develop-web

develop-api:
    @echo "==> API: http://localhost:8000 (docs at /docs)"
    cd "{{api_dir}}" && .venv/bin/fastapi dev app/main.py

develop-web: build-sdk
    @echo "==> Web: http://localhost:5173"
    npm run dev --workspace @acadian/web-client

# ----------------------------------------------------------------------------
# Deploy (production servers)
# ----------------------------------------------------------------------------

[parallel]
deploy: deploy-api deploy-web

deploy-api:
    cd "{{api_dir}}" && .venv/bin/fastapi run app/main.py

deploy-web: build-web
    npm run preview --workspace @acadian/web-client

# ----------------------------------------------------------------------------
# Test / Lint / Format
# ----------------------------------------------------------------------------

# Run all test suites.
test-all: test-api test-web

test-api:
    @echo "==> API tests (pytest)"
    cd "{{api_dir}}" && .venv/bin/pytest

test-web:
    @echo "==> Web tests (vitest)"
    npm run test --workspace @acadian/web-client

# Lint Python (ruff) and the frontend (oxlint).
lint:
    @echo "==> Linting API (ruff)"
    cd "{{api_dir}}" && .venv/bin/ruff check .
    @echo "==> Linting web client (oxlint)"
    npm run lint --workspace @acadian/web-client

# Format Python with ruff.
format:
    cd "{{api_dir}}" && .venv/bin/ruff format .

# Full CI pipeline: lint, build the SDK, and run every test suite.
ci: lint build-sdk test-all
    @echo
    @echo "CI checks passed."

# ----------------------------------------------------------------------------
# Housekeeping
# ----------------------------------------------------------------------------

# Remove build artifacts and caches (keeps installed dependencies).
clean:
    rm -rf "{{sdk_dir}}/dist" "{{web_dir}}/dist"
    find "{{api_dir}}" -type d -name __pycache__ -prune -exec rm -rf {} +
    rm -rf "{{api_dir}}/.pytest_cache" "{{api_dir}}/.ruff_cache" "{{api_dir}}/.coverage"
