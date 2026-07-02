# Setup the development environment by installing all required dependencies for both the frontend web client and the backend API service.
setup:
  @echo "--------------------------------------------------"
  @echo "Installing NPM packages for the frontend web client"
  @echo "--------------------------------------------------"
  @cd apps/web-client && npm install

  @echo "\n--------------------------------------------------"
  @echo "Installing pip modules for the backend API service"
  @echo "--------------------------------------------------\n"
  . ./apps/api-service/.venv/bin/activate
  @cd apps/api-service && pip install -r requirements.txt
  @echo "\nTODO: Install and run an OpenAPI Generator to build the SDK"

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

test-all:
  @echo 'WARNING: No test scripts have been implemented yet.'

lint:
  @echo 'WARNING: No lint scripts have been implemented yet.'

format:
  @echo 'WARNING: No format scripts have been implemented yet.'

ci:
  @echo 'WARNING: No CI scripts have been implemented yet.'