# Accessible Finance Planner database

The migration in `migrations/20260824010000_planner_foundation.sql` creates the
normalized Supabase foundation for web and future mobile clients. It stores plan
inputs only. Projection results stay on-device and are recalculated by the shared
finance engine.

## Apply the migration

Use one of the following methods. The CLI method is recommended because it keeps
Supabase's migration history aligned with this repository.

### Supabase CLI (recommended)

From the repository root in PowerShell:

```powershell
# Creates supabase/config.toml if this checkout has not been initialized yet.
npx.cmd supabase@latest init

# Opens the browser-based CLI login flow.
npx.cmd supabase@latest login

# PROJECT_REF is the short reference shown in the Supabase project URL/settings.
npx.cmd supabase@latest link --project-ref PROJECT_REF

# Applies all unapplied files in supabase/migrations in timestamp order.
npx.cmd supabase@latest db push
```

If `supabase/config.toml` already exists, skip `init`. Never commit the generated
`.supabase/` working directory or any database password printed or requested by
the CLI.

### Supabase Dashboard SQL Editor

For a new project where the CLI cannot be used:

1. Open **SQL Editor** in the intended Supabase project.
2. Choose **New query**.
3. Paste the complete contents of
   `supabase/migrations/20260824010000_planner_foundation.sql`.
4. Choose **Run** once. The migration is transactional, so an error rolls the
   whole migration back instead of leaving a partial schema.

Choose one application method for the initial migration. Dashboard execution does
not create the same local/remote CLI migration-history workflow, so do not later
run `db push` against that project until its migration history has been reconciled.

## Verify the security boundary

Run these read-only queries in the Dashboard SQL Editor after applying the
migration:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles', 'financial_plans', 'income_sources', 'expenses', 'assets',
    'debts', 'retirement_settings', 'scenarios', 'scenario_overrides',
    'financial_goals'
  )
order by tablename;
```

The query must return ten rows and every `rowsecurity` value must be `true`.

```sql
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles', 'financial_plans', 'income_sources', 'expenses', 'assets',
    'debts', 'retirement_settings', 'scenarios', 'scenario_overrides',
    'financial_goals'
  )
order by tablename, cmd;
```

The migration defines `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies for
each table. Policies are limited to the authenticated role and compare every
row's `user_id` with `auth.uid()`.

## Ownership and data-shape guarantees

- `user_id` defaults to `auth.uid()`, and RLS rejects a submitted owner that does
  not match the authenticated user.
- Every plan child has a composite `(plan_id, user_id)` foreign key to
  `financial_plans (id, user_id)`. A client cannot connect its row to a plan
  owned by somebody else.
- Scenario overrides are sparse JSON-object diffs. Ownership IDs and database
  metadata are forbidden inside the diff, while composite foreign keys bind the
  diff to the scenario, plan, and owner.
- A hardened Auth trigger creates a minimal profile for new users. The migration
  also backfills profiles for existing Auth users without replacing existing
  profile data.
- All modification timestamps are database-managed through a trigger function
  with an empty `search_path`.
- CPP and OAS amounts, start ages, taxability, and growth are explicit user
  inputs. The schema does not calculate or imply benefit entitlement.

## Client configuration boundary

Browser and mobile clients use only the project URL and Supabase's publishable
browser key through their documented environment variables. Never put a database
password, administrator credential, or other privileged secret in frontend code,
Netlify client variables, demo data, logs, or exported plans.

Demo mode must remain local and must not write fictional data to these tables
until an authenticated user explicitly chooses to import/save it.
