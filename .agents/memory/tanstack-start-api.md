---
name: TanStack Start API patterns
description: Correct API for createServerFn and server utilities in this project
---

## createServerFn validator
Use `.validator((d: unknown) => Schema.parse(d))` NOT `.inputValidator(Schema)`.
`.inputValidator()` is the deprecated Lovable/old API.

## Server request access
Import `getRequest` from `@tanstack/react-start/server` (NOT `getWebRequest` — that doesn't exist).

```ts
import { getRequest } from "@tanstack/react-start/server";
const req = getRequest();
const authHeader = req?.headers.get("authorization") ?? "";
```

**Why:** During migration from Lovable, the old code used `getWebRequest` which was a Lovable-specific export. `getRequest` is the correct TanStack Start export.
