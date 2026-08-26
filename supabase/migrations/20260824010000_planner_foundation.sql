-- Accessible Finance Planner database foundation.
--
-- Security model:
--   * Supabase Auth owns identities in auth.users.
--   * Every public row has an authenticated owner (`user_id`).
--   * Plan children use a composite foreign key (`plan_id`, `user_id`) so a
--     client cannot attach its row to another user's plan.
--   * Row Level Security (RLS) independently checks auth.uid() for every CRUD
--     operation. Frontend filtering is never an authorization boundary.
--
-- Financial inputs are stored here. Projection outputs are intentionally not
-- persisted; clients calculate them locally with the shared finance engine.

begin;

create extension if not exists pgcrypto with schema extensions;

-- Keep modification timestamps consistent without trusting clients. The empty
-- search_path prevents an attacker-controlled object from shadowing a function.
create or replace function public.set_planner_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_planner_updated_at() from public;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  first_name text,
  province_code text,
  date_of_birth date,
  currency_code text not null default 'CAD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_user_id_key unique (user_id),
  constraint profiles_first_name_length check (
    first_name is null or char_length(btrim(first_name)) between 1 and 80
  ),
  constraint profiles_province_code_check check (
    province_code is null or province_code in (
      'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
    )
  ),
  constraint profiles_date_of_birth_check check (
    date_of_birth is null or date_of_birth between date '1900-01-01' and current_date
  ),
  constraint profiles_currency_code_check check (currency_code = 'CAD')
);

comment on table public.profiles is
  'One planner profile per Supabase Auth user. Identity credentials remain in auth.users.';
comment on column public.profiles.province_code is
  'Canadian postal abbreviation; nullable until onboarding is complete.';

create table public.financial_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  schema_version smallint not null default 1,
  name text not null default 'My financial plan',
  base_year smallint not null default extract(year from current_date)::smallint,
  currency_code text not null default 'CAD',
  effective_tax_percent numeric(9, 4) not null default 0,
  general_inflation_percent numeric(9, 4) not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_plans_id_user_key unique (id, user_id),
  constraint financial_plans_name_check check (char_length(btrim(name)) between 1 and 100),
  constraint financial_plans_schema_version_check check (schema_version = 1),
  constraint financial_plans_base_year_check check (base_year between 1900 and 2200),
  constraint financial_plans_currency_code_check check (currency_code = 'CAD'),
  constraint financial_plans_effective_tax_check check (effective_tax_percent between 0 and 100),
  constraint financial_plans_general_inflation_check check (
    general_inflation_percent > -100 and general_inflation_percent <= 100
  )
);

comment on table public.financial_plans is
  'Baseline plan metadata and user-entered projection assumptions. Calculated projections are not stored.';
comment on column public.financial_plans.effective_tax_percent is
  'User-supplied flat effective tax assumption; no tax-table entitlement is implied.';

create table public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan_id uuid not null,
  name text not null,
  income_type text not null,
  amount numeric(16, 2) not null,
  frequency text not null,
  start_year smallint not null,
  end_year smallint,
  annual_growth_percent numeric(9, 4) not null default 0,
  taxable boolean not null default true,
  ends_at_retirement boolean,
  enabled boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint income_sources_plan_owner_fk
    foreign key (plan_id, user_id)
    references public.financial_plans (id, user_id)
    on delete cascade,
  constraint income_sources_name_check check (char_length(btrim(name)) between 1 and 120),
  constraint income_sources_type_check check (income_type in (
    'employment', 'self_employment', 'rental_income', 'pension',
    'government_benefit', 'investment_income', 'other', 'one_time'
  )),
  constraint income_sources_frequency_check check (frequency in (
    'monthly', 'biweekly', 'annual', 'one_time'
  )),
  constraint income_sources_amount_check check (amount >= 0),
  constraint income_sources_years_check check (
    start_year between 1900 and 2200
    and (end_year is null or (end_year between start_year and 2200))
  ),
  constraint income_sources_growth_check check (
    annual_growth_percent between -100 and 100
  ),
  constraint income_sources_position_check check (position >= 0)
);

comment on table public.income_sources is
  'Recurring or one-time gross income inputs. Amount is per frequency; rates are percentage points.';

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan_id uuid not null,
  name text not null,
  category text not null,
  amount numeric(16, 2) not null,
  frequency text not null,
  start_year smallint not null,
  end_year smallint,
  inflation_percent numeric(9, 4) not null default 0,
  is_essential boolean not null default false,
  enabled boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expenses_plan_owner_fk
    foreign key (plan_id, user_id)
    references public.financial_plans (id, user_id)
    on delete cascade,
  constraint expenses_name_check check (char_length(btrim(name)) between 1 and 120),
  constraint expenses_category_check check (category in (
    'housing', 'food', 'transportation', 'utilities', 'insurance', 'travel',
    'entertainment', 'healthcare', 'childcare', 'education', 'subscriptions',
    'other', 'one_time'
  )),
  constraint expenses_frequency_check check (frequency in (
    'monthly', 'biweekly', 'annual', 'one_time'
  )),
  constraint expenses_amount_check check (amount >= 0),
  constraint expenses_years_check check (
    start_year between 1900 and 2200
    and (end_year is null or (end_year between start_year and 2200))
  ),
  constraint expenses_inflation_check check (inflation_percent between -100 and 100),
  constraint expenses_position_check check (position >= 0)
);

comment on table public.expenses is
  'Recurring or one-time spending inputs. Amount is per frequency; inflation is in percentage points.';

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan_id uuid not null,
  name text not null,
  asset_type text not null,
  category text,
  current_value numeric(16, 2) not null default 0,
  expected_return_percent numeric(9, 4),
  post_retirement_return_percent numeric(9, 4),
  annual_appreciation_percent numeric(9, 4),
  annual_contribution numeric(16, 2),
  contribution_frequency text,
  contribution_start_year smallint,
  contribution_end_year smallint,
  start_year smallint,
  enabled boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assets_plan_owner_fk
    foreign key (plan_id, user_id)
    references public.financial_plans (id, user_id)
    on delete cascade,
  constraint assets_name_check check (char_length(btrim(name)) between 1 and 120),
  constraint assets_type_check check (asset_type in (
    'chequing', 'savings', 'cash', 'tfsa', 'rrsp', 'fhsa', 'resp', 'rrif',
    'non_registered_investment', 'primary_residence', 'rental_property',
    'pension', 'other'
  )),
  constraint assets_category_check check (
    category is null or category in ('cash', 'investment', 'property', 'pension', 'other')
  ),
  constraint assets_current_value_check check (current_value >= 0),
  constraint assets_expected_return_check check (
    expected_return_percent is null or expected_return_percent between -100 and 100
  ),
  constraint assets_post_retirement_return_check check (
    post_retirement_return_percent is null or post_retirement_return_percent between -100 and 100
  ),
  constraint assets_appreciation_check check (
    annual_appreciation_percent is null or annual_appreciation_percent between -100 and 100
  ),
  constraint assets_contribution_check check (
    annual_contribution is null or annual_contribution >= 0
  ),
  constraint assets_contribution_frequency_check check (
    contribution_frequency is null or contribution_frequency in ('monthly', 'biweekly', 'annual')
  ),
  constraint assets_contribution_years_check check (
    (contribution_start_year is null and contribution_end_year is null)
    or (
      contribution_start_year between 1900 and 2200
      and (contribution_end_year is null or contribution_end_year between contribution_start_year and 2200)
    )
  ),
  constraint assets_start_year_check check (
    start_year is null or start_year between 1900 and 2200
  ),
  constraint assets_position_check check (position >= 0)
);

comment on table public.assets is
  'Canadian account, property, cash, pension, and other asset inputs. Rates are percentage points.';

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan_id uuid not null,
  name text not null,
  debt_type text not null,
  balance numeric(16, 2) not null default 0,
  annual_interest_percent numeric(9, 4) not null default 0,
  payment_amount numeric(16, 2) not null default 0,
  payment_frequency text not null default 'monthly',
  remaining_amortization_months integer not null,
  extra_payment_amount numeric(16, 2) not null default 0,
  compounding_periods_per_year integer,
  start_year smallint,
  enabled boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint debts_plan_owner_fk
    foreign key (plan_id, user_id)
    references public.financial_plans (id, user_id)
    on delete cascade,
  constraint debts_name_check check (char_length(btrim(name)) between 1 and 120),
  constraint debts_type_check check (debt_type in (
    'mortgage', 'heloc', 'line_of_credit', 'credit_card', 'car_loan',
    'student_loan', 'personal_loan', 'other'
  )),
  constraint debts_balance_check check (balance >= 0),
  constraint debts_interest_check check (annual_interest_percent between 0 and 100),
  constraint debts_payment_check check (payment_amount >= 0),
  constraint debts_payment_frequency_check check (payment_frequency in (
    'monthly', 'biweekly', 'annual'
  )),
  constraint debts_amortization_check check (
    remaining_amortization_months is null
    or remaining_amortization_months between 0 and 1200
  ),
  constraint debts_extra_payment_check check (extra_payment_amount >= 0),
  constraint debts_compounding_periods_check check (
    compounding_periods_per_year is null or compounding_periods_per_year between 1 and 365
  ),
  constraint debts_start_year_check check (
    start_year is null or start_year between 1900 and 2200
  ),
  constraint debts_position_check check (position >= 0)
);

comment on table public.debts is
  'Debt balances and payment inputs used by the client-side amortization engine.';

create table public.retirement_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan_id uuid not null,
  retirement_age smallint not null,
  planning_end_age smallint not null,
  estimated_annual_spending numeric(16, 2) not null,
  inflation_percent numeric(9, 4) not null,
  investment_return_before_percent numeric(9, 4) not null,
  investment_return_after_percent numeric(9, 4) not null,
  expense_mode text not null,
  cpp_enabled boolean not null,
  cpp_annual_estimate numeric(16, 2) not null,
  cpp_start_age smallint not null,
  cpp_taxable boolean not null,
  cpp_annual_growth_percent numeric(9, 4) not null,
  oas_enabled boolean not null,
  oas_annual_estimate numeric(16, 2) not null,
  oas_start_age smallint not null,
  oas_taxable boolean not null,
  oas_annual_growth_percent numeric(9, 4) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint retirement_settings_plan_user_key unique (plan_id, user_id),
  constraint retirement_settings_plan_owner_fk
    foreign key (plan_id, user_id)
    references public.financial_plans (id, user_id)
    on delete cascade,
  constraint retirement_settings_ages_check check (
    retirement_age between 18 and 100
    and planning_end_age > retirement_age
    and planning_end_age <= 120
  ),
  constraint retirement_settings_spending_check check (estimated_annual_spending >= 0),
  constraint retirement_settings_inflation_check check (inflation_percent between -100 and 100),
  constraint retirement_settings_return_before_check check (
    investment_return_before_percent between -100 and 100
  ),
  constraint retirement_settings_return_after_check check (
    investment_return_after_percent between -100 and 100
  ),
  constraint retirement_settings_expense_mode_check check (
    expense_mode in ('replace_recurring', 'add_to_recurring')
  ),
  constraint retirement_settings_cpp_amount_check check (cpp_annual_estimate >= 0),
  constraint retirement_settings_cpp_age_check check (cpp_start_age between 18 and 120),
  constraint retirement_settings_cpp_growth_check check (
    cpp_annual_growth_percent between -100 and 100
  ),
  constraint retirement_settings_oas_amount_check check (oas_annual_estimate >= 0),
  constraint retirement_settings_oas_age_check check (oas_start_age between 18 and 120),
  constraint retirement_settings_oas_growth_check check (
    oas_annual_growth_percent between -100 and 100
  )
);

comment on table public.retirement_settings is
  'User-entered retirement assumptions. CPP and OAS are manual estimates, not server-calculated benefits.';

create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan_id uuid not null,
  name text not null,
  description text,
  is_baseline boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scenarios_id_plan_user_key unique (id, plan_id, user_id),
  constraint scenarios_plan_owner_fk
    foreign key (plan_id, user_id)
    references public.financial_plans (id, user_id)
    on delete cascade,
  constraint scenarios_name_check check (char_length(btrim(name)) between 1 and 100),
  constraint scenarios_description_check check (
    description is null or char_length(description) <= 1000
  ),
  constraint scenarios_plan_name_key unique (plan_id, user_id, name)
);

comment on table public.scenarios is
  'Named alternatives represented as sparse overrides; is_baseline supports an explicit baseline label.';

create table public.scenario_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan_id uuid not null,
  scenario_id uuid not null,
  entity_type text not null,
  target_id uuid not null,
  operation text not null default 'update',
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scenario_overrides_plan_owner_fk
    foreign key (plan_id, user_id)
    references public.financial_plans (id, user_id)
    on delete cascade,
  constraint scenario_overrides_scenario_owner_fk
    foreign key (scenario_id, plan_id, user_id)
    references public.scenarios (id, plan_id, user_id)
    on delete cascade,
  constraint scenario_overrides_entity_type_check check (entity_type in (
    'financial_plan', 'income_source', 'expense', 'asset', 'debt',
    'retirement_settings', 'financial_goal'
  )),
  constraint scenario_overrides_plan_target_check check (
    entity_type <> 'financial_plan' or target_id = plan_id
  ),
  constraint scenario_overrides_operation_check check (operation in ('add', 'update', 'delete')),
  constraint scenario_overrides_changes_object_check check (jsonb_typeof(changes) = 'object'),
  constraint scenario_overrides_changes_content_check check (
    (operation = 'delete' and changes = '{}'::jsonb)
    or (operation in ('add', 'update') and changes <> '{}'::jsonb)
  ),
  constraint scenario_overrides_immutable_fields_check check (
    not (changes ?| array[
      'id', 'user_id', 'userId', 'plan_id', 'planId', 'scenario_id',
      'scenarioId', 'target_id', 'targetId', 'entity_type', 'operation',
      'created_at', 'createdAt', 'updated_at', 'updatedAt'
    ]::text[])
  ),
  constraint scenario_overrides_target_key unique (scenario_id, entity_type, target_id)
);

comment on table public.scenario_overrides is
  'Sparse scenario diffs. `changes` contains only modified domain fields; add/delete operations represent collection differences.';
comment on column public.scenario_overrides.target_id is
  'ID of the baseline entity, or a client-generated UUID for an entity added only in this scenario.';
comment on column public.scenario_overrides.changes is
  'A shape-constrained JSON diff; clients also validate domain keys and values before saving.';

create table public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan_id uuid not null,
  name text not null,
  goal_type text not null default 'other',
  target_amount numeric(16, 2) not null,
  current_amount numeric(16, 2) not null default 0,
  target_year smallint,
  priority smallint not null default 3,
  is_completed boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_goals_plan_owner_fk
    foreign key (plan_id, user_id)
    references public.financial_plans (id, user_id)
    on delete cascade,
  constraint financial_goals_name_check check (char_length(btrim(name)) between 1 and 120),
  constraint financial_goals_type_check check (goal_type in (
    'retirement', 'emergency_fund', 'home_purchase', 'education', 'travel',
    'debt_payoff', 'other'
  )),
  constraint financial_goals_target_amount_check check (target_amount >= 0),
  constraint financial_goals_current_amount_check check (current_amount >= 0),
  constraint financial_goals_target_year_check check (
    target_year is null or target_year between 1900 and 2200
  ),
  constraint financial_goals_priority_check check (priority between 1 and 5),
  constraint financial_goals_position_check check (position >= 0)
);

comment on table public.financial_goals is
  'Optional savings and debt-payoff goals associated with a plan.';

-- Query indexes. Unique constraints above already index owner identities and
-- scenario targets; these indexes cover common per-user/per-plan list queries.
create unique index financial_plans_one_default_per_user_idx
  on public.financial_plans (user_id)
  where is_default;
create index financial_plans_user_updated_idx
  on public.financial_plans (user_id, updated_at desc);
create index income_sources_owner_plan_idx
  on public.income_sources (user_id, plan_id, position);
create index expenses_owner_plan_idx
  on public.expenses (user_id, plan_id, position);
create index assets_owner_plan_idx
  on public.assets (user_id, plan_id, position);
create index debts_owner_plan_idx
  on public.debts (user_id, plan_id, position);
create index retirement_settings_owner_plan_idx
  on public.retirement_settings (user_id, plan_id);
create index scenarios_owner_plan_idx
  on public.scenarios (user_id, plan_id, updated_at desc);
create unique index scenarios_one_baseline_per_plan_idx
  on public.scenarios (plan_id, user_id)
  where is_baseline;
create index scenario_overrides_owner_scenario_idx
  on public.scenario_overrides (user_id, scenario_id);
create index financial_goals_owner_plan_idx
  on public.financial_goals (user_id, plan_id, position);

-- Apply updated_at consistently to all user-data tables.
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_planner_updated_at();

create trigger financial_plans_set_updated_at
before update on public.financial_plans
for each row execute function public.set_planner_updated_at();

create trigger income_sources_set_updated_at
before update on public.income_sources
for each row execute function public.set_planner_updated_at();

create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_planner_updated_at();

create trigger assets_set_updated_at
before update on public.assets
for each row execute function public.set_planner_updated_at();

create trigger debts_set_updated_at
before update on public.debts
for each row execute function public.set_planner_updated_at();

create trigger retirement_settings_set_updated_at
before update on public.retirement_settings
for each row execute function public.set_planner_updated_at();

create trigger scenarios_set_updated_at
before update on public.scenarios
for each row execute function public.set_planner_updated_at();

create trigger scenario_overrides_set_updated_at
before update on public.scenario_overrides
for each row execute function public.set_planner_updated_at();

create trigger financial_goals_set_updated_at
before update on public.financial_goals
for each row execute function public.set_planner_updated_at();

-- Create a minimal profile after email/password signup. This definer function is
-- limited to a single explicit INSERT and cannot be called by API roles.
create or replace function public.create_planner_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, first_name)
  values (
    new.id,
    left(
      nullif(btrim(coalesce(new.raw_user_meta_data ->> 'first_name', '')), ''),
      80
    )
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.create_planner_profile_for_new_user() from public;

drop trigger if exists create_accessible_finance_planner_profile on auth.users;
create trigger create_accessible_finance_planner_profile
after insert on auth.users
for each row execute function public.create_planner_profile_for_new_user();

-- Backfill users created before this migration. The migration executor has the
-- required auth schema access; browser clients never receive it.
insert into public.profiles (user_id, first_name)
select
  id,
  left(
    nullif(btrim(coalesce(raw_user_meta_data ->> 'first_name', '')), ''),
    80
  )
from auth.users
on conflict (user_id) do nothing;

-- RLS is mandatory on every table exposed through the public API schema.
alter table public.profiles enable row level security;
alter table public.financial_plans enable row level security;
alter table public.income_sources enable row level security;
alter table public.expenses enable row level security;
alter table public.assets enable row level security;
alter table public.debts enable row level security;
alter table public.retirement_settings enable row level security;
alter table public.scenarios enable row level security;
alter table public.scenario_overrides enable row level security;
alter table public.financial_goals enable row level security;

-- Profiles: an authenticated user can access only the row whose owner is the
-- current auth.uid(). WITH CHECK also prevents changing ownership on update.
create policy profiles_select_own
on public.profiles for select to authenticated
using (user_id = (select auth.uid()));

create policy profiles_insert_own
on public.profiles for insert to authenticated
with check (user_id = (select auth.uid()));

create policy profiles_update_own
on public.profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy profiles_delete_own
on public.profiles for delete to authenticated
using (user_id = (select auth.uid()));

-- Financial plans.
create policy financial_plans_select_own
on public.financial_plans for select to authenticated
using (user_id = (select auth.uid()));

create policy financial_plans_insert_own
on public.financial_plans for insert to authenticated
with check (user_id = (select auth.uid()));

create policy financial_plans_update_own
on public.financial_plans for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy financial_plans_delete_own
on public.financial_plans for delete to authenticated
using (user_id = (select auth.uid()));

-- Income sources.
create policy income_sources_select_own
on public.income_sources for select to authenticated
using (user_id = (select auth.uid()));

create policy income_sources_insert_own
on public.income_sources for insert to authenticated
with check (user_id = (select auth.uid()));

create policy income_sources_update_own
on public.income_sources for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy income_sources_delete_own
on public.income_sources for delete to authenticated
using (user_id = (select auth.uid()));

-- Expenses.
create policy expenses_select_own
on public.expenses for select to authenticated
using (user_id = (select auth.uid()));

create policy expenses_insert_own
on public.expenses for insert to authenticated
with check (user_id = (select auth.uid()));

create policy expenses_update_own
on public.expenses for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy expenses_delete_own
on public.expenses for delete to authenticated
using (user_id = (select auth.uid()));

-- Assets.
create policy assets_select_own
on public.assets for select to authenticated
using (user_id = (select auth.uid()));

create policy assets_insert_own
on public.assets for insert to authenticated
with check (user_id = (select auth.uid()));

create policy assets_update_own
on public.assets for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy assets_delete_own
on public.assets for delete to authenticated
using (user_id = (select auth.uid()));

-- Debts.
create policy debts_select_own
on public.debts for select to authenticated
using (user_id = (select auth.uid()));

create policy debts_insert_own
on public.debts for insert to authenticated
with check (user_id = (select auth.uid()));

create policy debts_update_own
on public.debts for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy debts_delete_own
on public.debts for delete to authenticated
using (user_id = (select auth.uid()));

-- Retirement settings.
create policy retirement_settings_select_own
on public.retirement_settings for select to authenticated
using (user_id = (select auth.uid()));

create policy retirement_settings_insert_own
on public.retirement_settings for insert to authenticated
with check (user_id = (select auth.uid()));

create policy retirement_settings_update_own
on public.retirement_settings for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy retirement_settings_delete_own
on public.retirement_settings for delete to authenticated
using (user_id = (select auth.uid()));

-- Scenarios.
create policy scenarios_select_own
on public.scenarios for select to authenticated
using (user_id = (select auth.uid()));

create policy scenarios_insert_own
on public.scenarios for insert to authenticated
with check (user_id = (select auth.uid()));

create policy scenarios_update_own
on public.scenarios for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy scenarios_delete_own
on public.scenarios for delete to authenticated
using (user_id = (select auth.uid()));

-- Sparse scenario diffs.
create policy scenario_overrides_select_own
on public.scenario_overrides for select to authenticated
using (user_id = (select auth.uid()));

create policy scenario_overrides_insert_own
on public.scenario_overrides for insert to authenticated
with check (user_id = (select auth.uid()));

create policy scenario_overrides_update_own
on public.scenario_overrides for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy scenario_overrides_delete_own
on public.scenario_overrides for delete to authenticated
using (user_id = (select auth.uid()));

-- Financial goals.
create policy financial_goals_select_own
on public.financial_goals for select to authenticated
using (user_id = (select auth.uid()));

create policy financial_goals_insert_own
on public.financial_goals for insert to authenticated
with check (user_id = (select auth.uid()));

create policy financial_goals_update_own
on public.financial_goals for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy financial_goals_delete_own
on public.financial_goals for delete to authenticated
using (user_id = (select auth.uid()));

-- Public visitors never query cloud planner data. Authenticated clients receive
-- only CRUD privileges; RLS above still decides which rows each query can touch.
revoke all on table
  public.profiles,
  public.financial_plans,
  public.income_sources,
  public.expenses,
  public.assets,
  public.debts,
  public.retirement_settings,
  public.scenarios,
  public.scenario_overrides,
  public.financial_goals
from anon;
-- Revoke first so projects with permissive default table privileges converge to
-- the same explicit grant set.
revoke all on table
  public.profiles,
  public.financial_plans,
  public.income_sources,
  public.expenses,
  public.assets,
  public.debts,
  public.retirement_settings,
  public.scenarios,
  public.scenario_overrides,
  public.financial_goals
from authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.financial_plans,
  public.income_sources,
  public.expenses,
  public.assets,
  public.debts,
  public.retirement_settings,
  public.scenarios,
  public.scenario_overrides,
  public.financial_goals
to authenticated;

commit;
