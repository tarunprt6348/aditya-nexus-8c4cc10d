---
name: Supabase untyped tables pattern
description: How to safely call Supabase tables that are not in the generated types.ts
---

Several tables exist in the DB but were not included in the Supabase type generation:
`audit_logs`, `impersonation_log`, `role_permissions`, `user_sessions`

## Pattern
Cast BOTH the table name AND the data object with `as never`:

```ts
// INSERT
await supabase.from("audit_logs" as never).insert({ actor_id: "...", ... } as never);

// UPDATE
await supabase.from("impersonation_log" as never).update({ ended_at: "..." } as never).eq("id", id);

// SELECT with result cast
const { data } = await supabase.from("user_sessions" as never).select("*").eq(...) as { data: MyType[] | null };
```

**Why:** Casting only the table name results in the return/parameter types being `never[]`, which rejects object literals with TS2353. Both casts are needed.

**How to apply:** Any time you see a Supabase query error TS2353 "does not exist in type 'never[]'", add `as never` to the object being inserted/updated.
