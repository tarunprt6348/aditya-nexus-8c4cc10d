---
name: pg vs postgres ESM incompatibility
description: The `pg` npm package fails in Vite/Vinxi module runner; use `postgres` instead.
---

## Rule
Never use the `pg` npm package in a TanStack Start / Vinxi project. Use `postgres` instead.

**Why:** `pg`'s ESM entry (`pg/esm/index.mjs`) tries to `require()` its own CJS code at runtime. Vite's module runner evaluates code in an ESM context where `require` is not defined. This causes `ReferenceError: require is not defined` for every server request.

**How to apply:**
- Install: `npm install postgres`
- Import: `import postgres from "postgres"`
- Create client: `const sql = postgres(process.env.DATABASE_URL, { max: 10, ... })`
- Parameterized queries: `sql.unsafe(queryText, paramsArray)`
- Transactions: `sql.begin(async tx => { await tx.unsafe(...); })`
- Do NOT install or import `pg` or `@types/pg`.
