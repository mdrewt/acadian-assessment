# @acadian/sdk

A typed TypeScript client for the MAG7 Returns API, generated from the backend's
OpenAPI schema with [`@hey-api/openapi-ts`](https://heyapi.dev). The frontend
depends on this so it doesn't hand-write API types, URLs, or fetch logic.

## Usage

```ts
import { configureSdk, getReturns, type ReturnsByTicker } from '@acadian/sdk'

// once, at app startup:
configureSdk({ baseUrl: 'http://localhost:8000' })

const { data, error } = await getReturns({
  query: { start: '2024-01-01', end: '2024-01-31' },
})
if (error) {
  // typed error envelope (400 / 422 / 502)
} else {
  const returns: ReturnsByTicker = data
}
```

## Regenerating

The client is regenerated from the API contract on every build; it's never
hand-edited. From the repo root:

```bash
just build-sdk
```

which does three things:

1. `python apps/api-service/scripts/export_openapi.py libs/sdk/openapi.json`
   exports the schema from the FastAPI app (no server needed).
2. `npm run generate` regenerates `src/client/` with `@hey-api/openapi-ts`.
3. `npm run build` compiles the SDK to `dist/` with `tsc`.

Generation config lives in [`openapi-ts.config.ts`](openapi-ts.config.ts).

## Layout

```text
openapi.json          # the API contract this client is generated from
openapi-ts.config.ts  # generation config (input, output, plugins)
src/
├── client/           # generated code (fetch client + types + operations)
└── index.ts          # public surface: re-exports + configureSdk() helper
dist/                 # compiled output used by the web client (gitignored)
```

The generated fetch client is self-contained, so this package has no runtime
dependencies.
