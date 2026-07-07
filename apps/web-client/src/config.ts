/**
 * Runtime configuration derived from Vite environment variables.
 *
 * Set `VITE_API_URL` (see `.env.example`) to point the client at a specific
 * API deployment; it defaults to the local FastAPI dev server.
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
