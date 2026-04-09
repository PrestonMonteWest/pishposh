/*
 * This adds environment variable context to the `import.meta.env`
 * interface.
 */

interface ImportMetaEnv {
  readonly API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
