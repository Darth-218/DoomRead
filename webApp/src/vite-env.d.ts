/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module '*.svelte' {
  // Fallback typing so plain `tsc` can resolve .svelte imports; the Svelte
  // language server provides precise component types during development.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: any
  export default component
}

