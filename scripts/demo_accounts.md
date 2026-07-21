# Demo Accounts

See [DEMO_ACCOUNTS.md](../DEMO_ACCOUNTS.md) in the project root for all demo login credentials.

All accounts use the password: `Demo_Lost.experts.reassigned`

To re-seed a fresh database:
```bash
psql "$DATABASE_URL" -f scripts/schema_replit.sql
node scripts/seed.mjs
```
