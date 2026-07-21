---
name: TanStack Start server import rules
description: How to avoid the import-protection build error when server-only files are imported by client-visible modules.
---

## The Rule
Files imported by client-side route code (e.g. route.tsx `beforeLoad`) must NOT statically import any `*.server.*` local file.

TanStack Start's bundler enforces `**/*.server.*` import protection — if a client-bundled file has a static `import` from a `.server.ts` file, the production build fails with `[import-protection] Import denied in client environment`.

## How to apply
- `createServerFn` handlers are server-only BUT their *module's top-level imports* are still bundled client-side. Use **dynamic imports inside handler bodies** for server-only dependencies:
  ```ts
  handler: async ({ data }) => {
    const { hashPassword } = await import("./auth.server");
    const { queryOne } = await import("./db.server");
  }
  ```
- Server-only *helper functions* (like `getVerifiedUser`) must live in a `*.server.ts` file — never exported from a client-importable module.
- `getVerifiedUser` lives in `src/lib/auth.server.ts` (not `auth.functions.ts`). Import it from there in all server handler files.

**Why:** `auth.functions.ts` is imported by route `beforeLoad` (client) for `getMe`. A static import of `./auth.server` in the same file caused a build failure until we moved the helper to `auth.server.ts` and switched to dynamic imports.
