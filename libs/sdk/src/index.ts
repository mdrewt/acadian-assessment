/**
 * `@acadian/sdk` — a typed client for the MAG7 Returns API.
 *
 * The bulk of this module is generated from the backend's OpenAPI schema by
 * `@hey-api/openapi-ts` (see `openapi-ts.config.ts`). Regenerate after backend
 * changes with `npm run generate`. This file adds a small, stable public
 * surface on top of the generated code.
 */

// Re-export the generated operations (getReturns) and their types.
export * from './client'

// Re-export the shared client instance so consumers can inspect/override it.
export { client } from './client/client.gen'

import { client } from './client/client.gen'
import type { ReturnPoint } from './client'

/**
 * The `/returns` payload: an object keyed by ticker symbol, each mapping to
 * that ticker's ordered list of daily returns.
 */
export type ReturnsByTicker = Record<string, ReturnPoint[]>

export interface ConfigureSdkOptions {
  /** Base URL of the API service, e.g. `http://localhost:8000`. */
  baseUrl: string
}

/**
 * Point the SDK at a running API instance. Call once during app startup,
 * before issuing any requests.
 */
export function configureSdk({ baseUrl }: ConfigureSdkOptions): void {
  client.setConfig({ baseUrl })
}
