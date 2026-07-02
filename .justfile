setup:
  @echo "--------------------------------------------------"
  @echo "Installing NPM packages for the frontend web client"
  @echo "--------------------------------------------------"
  @cd apps/web-client && npm install

  @echo "\n--------------------------------------------------"
  @echo "Installing pip modules for the backend API service"
  @echo "--------------------------------------------------\n"
  @cd apps/api-service && echo "TODO: Install pip modules."

build-all:
  @echo "--------------------------------------------------"
  @echo "Bundling the frontend web client for Deployment"
  @echo "--------------------------------------------------"
  @cd apps/web-client && npm run build

develop:
  @echo "--------------------------------------------------"
  @echo "Deploying the web client with live-reload enabled"
  @echo "--------------------------------------------------"
  @cd apps/web-client && npm run dev

deploy-all:
  @echo "--------------------------------------------------"
  @echo "Deploying the web client from the build artifacts"
  @echo "--------------------------------------------------"
  @echo "\nTODO: Replace 'dev' with actual deployment commands,"
  @cd apps/web-client && npm run build && npm run dev

test-all:
  @echo 'WARNING: No test scripts have been implemented yet.'

lint:
  @echo 'WARNING: No lint scripts have been implemented yet.'

format:
  @echo 'WARNING: No format scripts have been implemented yet.'

ci:
  @echo 'WARNING: No CI scripts have been implemented yet.'