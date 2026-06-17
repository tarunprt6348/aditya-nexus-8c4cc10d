---
name: Deployment ERESOLVE fix
description: npm install fails on deployment due to @tanstack/react-start peerOptional vite>=7 conflicting with pinned vite@6.4.3
---

## The rule
Always keep `.npmrc` with `legacy-peer-deps=true` in the project root. Without it, `npm install` on a clean environment fails with ERESOLVE because `@tanstack/react-start@1.168.x` declares `peerOptional vite@">=7.0.0"` and npm tries to pull vite@8, conflicting with `"vite": "^6.3.5"` in devDependencies.

**Why:** The app runs fine on vite@6.4.3. The peer dep is `peerOptional` (not strict), so legacy mode allows the install to proceed without changing any actual versions. Upgrading vite to v7 or v8 would risk breaking TanStack Router/Start SSR compatibility.

**How to apply:** If deployment ever fails with ERESOLVE again, check `.npmrc` for `legacy-peer-deps=true`. Also check `package-lock.json` lockfile has vite@6.4.x, not v8.
