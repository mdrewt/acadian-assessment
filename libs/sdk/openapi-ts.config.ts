import { defineConfig } from '@hey-api/openapi-ts'

// Regenerates the typed client from the backend's OpenAPI schema.
//
// The schema is exported ahead of time by the API service
// (`python scripts/export_openapi.py libs/sdk/openapi.json`) so generation
// never requires a running server. Run via `npm run generate`.
//
// The fetch client runtime is bundled directly into the generated output
// (under `src/client/`), so the SDK has no runtime dependencies.
export default defineConfig({
  input: './openapi.json',
  output: {
    path: './src/client',
    // The SDK owns its generated output; keep it out of app lint/format.
    postProcess: [],
  },
  plugins: ['@hey-api/client-fetch', '@hey-api/typescript', '@hey-api/sdk'],
})
