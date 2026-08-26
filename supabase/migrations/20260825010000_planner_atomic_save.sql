-- Atomic, optimistic-concurrency save boundary for planner snapshots.
-- Existing direct table policies and grants remain available for compatible
-- clients, while current clients can opt into the safer explicit-save RPC.

begin;

alter table public.financial_plans
  add column revision bigint not null default 0,
  add constraint financial_plans_revision_check check (revision >= 0);

comment on column public.financial_plans.revision is
  'Optimistic concurrency token. Atomic planner saves require the revision returned by the preceding load/save.';

create or replace function public.bump_planner_revision()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.revision = old.revision + 1;
  return new;
end;
$$;

revoke all on function public.bump_planner_revision() from public;

create trigger financial_plans_bump_revision
before update on public.financial_plans
for each row execute function public.bump_planner_revision();

create or replace function public.save_planner_snapshot(
  p_payload jsonb,
  p_expected_revision bigint default null
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan_id uuid;
  v_revision bigint;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'planner_authentication_required';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception using errcode = '22023', message = 'invalid_planner_save_payload';
  end if;
  if p_expected_revision is not null and p_expected_revision < 0 then
    raise exception using errcode = '22023', message = 'invalid_planner_revision';
  end if;
  if jsonb_typeof(p_payload -> 'profile') <> 'object'
    or jsonb_typeof(p_payload -> 'plan') <> 'object'
    or jsonb_typeof(p_payload -> 'retirement') <> 'object'
    or jsonb_typeof(p_payload -> 'income_sources') <> 'array'
    or jsonb_typeof(p_payload -> 'expenses') <> 'array'
    or jsonb_typeof(p_payload -> 'assets') <> 'array'
    or jsonb_typeof(p_payload -> 'debts') <> 'array'
    or jsonb_typeof(p_payload -> 'scenarios') <> 'array'
    or jsonb_typeof(p_payload -> 'scenario_overrides') <> 'array'
  then
    raise exception using errcode = '22023', message = 'invalid_planner_save_payload';
  end if;
  if jsonb_array_length(p_payload -> 'income_sources') > 250
    or jsonb_array_length(p_payload -> 'expenses') > 250
    or jsonb_array_length(p_payload -> 'assets') > 250
    or jsonb_array_length(p_payload -> 'debts') > 250
    or jsonb_array_length(p_payload -> 'scenarios') > 50
    or jsonb_array_length(p_payload -> 'scenario_overrides') > 5000
  then
    raise exception using errcode = '54000', message = 'planner_save_capacity_exceeded';
  end if;

  begin
    v_plan_id := nullif(p_payload #>> '{plan,id}', '')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode = '22023', message = 'invalid_planner_plan_id';
  end;
  if v_plan_id is null then
    raise exception using errcode = '22023', message = 'invalid_planner_plan_id';
  end if;

  if (p_payload #>> '{retirement,plan_id}') is distinct from v_plan_id::text
    or exists (
      select 1 from jsonb_array_elements(p_payload -> 'income_sources') as item
      where item ->> 'plan_id' is distinct from v_plan_id::text
    )
    or exists (
      select 1 from jsonb_array_elements(p_payload -> 'expenses') as item
      where item ->> 'plan_id' is distinct from v_plan_id::text
    )
    or exists (
      select 1 from jsonb_array_elements(p_payload -> 'assets') as item
      where item ->> 'plan_id' is distinct from v_plan_id::text
    )
    or exists (
      select 1 from jsonb_array_elements(p_payload -> 'debts') as item
      where item ->> 'plan_id' is distinct from v_plan_id::text
    )
    or exists (
      select 1 from jsonb_array_elements(p_payload -> 'scenarios') as item
      where item ->> 'plan_id' is distinct from v_plan_id::text
    )
    or exists (
      select 1 from jsonb_array_elements(p_payload -> 'scenario_overrides') as item
      where item ->> 'plan_id' is distinct from v_plan_id::text
    )
  then
    raise exception using errcode = '22023', message = 'planner_payload_plan_mismatch';
  end if;

  if p_expected_revision is null then
    begin
      insert into public.financial_plans (
        id,
        user_id,
        schema_version,
        name,
        base_year,
        currency_code,
        effective_tax_percent,
        general_inflation_percent,
        is_default
      ) values (
        v_plan_id,
        v_user_id,
        (p_payload #>> '{plan,schema_version}')::smallint,
        p_payload #>> '{plan,name}',
        (p_payload #>> '{plan,base_year}')::smallint,
        p_payload #>> '{plan,currency_code}',
        (p_payload #>> '{plan,effective_tax_percent}')::numeric,
        (p_payload #>> '{plan,general_inflation_percent}')::numeric,
        (p_payload #>> '{plan,is_default}')::boolean
      )
      returning revision into v_revision;
    exception when unique_violation then
      raise exception using errcode = 'P0001', message = 'planner_revision_conflict';
    end;
  else
    update public.financial_plans
    set
      schema_version = (p_payload #>> '{plan,schema_version}')::smallint,
      name = p_payload #>> '{plan,name}',
      base_year = (p_payload #>> '{plan,base_year}')::smallint,
      currency_code = p_payload #>> '{plan,currency_code}',
      effective_tax_percent = (p_payload #>> '{plan,effective_tax_percent}')::numeric,
      general_inflation_percent = (p_payload #>> '{plan,general_inflation_percent}')::numeric,
      is_default = (p_payload #>> '{plan,is_default}')::boolean
    where id = v_plan_id
      and user_id = v_user_id
      and revision = p_expected_revision
    returning revision into v_revision;

    if not found then
      raise exception using errcode = 'P0001', message = 'planner_revision_conflict';
    end if;
  end if;

  insert into public.profiles (
    user_id,
    first_name,
    province_code,
    date_of_birth,
    currency_code
  ) values (
    v_user_id,
    p_payload #>> '{profile,first_name}',
    p_payload #>> '{profile,province_code}',
    (p_payload #>> '{profile,date_of_birth}')::date,
    p_payload #>> '{profile,currency_code}'
  )
  on conflict (user_id) do update set
    first_name = excluded.first_name,
    province_code = excluded.province_code,
    date_of_birth = excluded.date_of_birth,
    currency_code = excluded.currency_code;

  insert into public.retirement_settings (
    user_id,
    plan_id,
    retirement_age,
    planning_end_age,
    estimated_annual_spending,
    inflation_percent,
    investment_return_before_percent,
    investment_return_after_percent,
    expense_mode,
    cpp_enabled,
    cpp_annual_estimate,
    cpp_start_age,
    cpp_taxable,
    cpp_annual_growth_percent,
    oas_enabled,
    oas_annual_estimate,
    oas_start_age,
    oas_taxable,
    oas_annual_growth_percent
  ) values (
    v_user_id,
    v_plan_id,
    (p_payload #>> '{retirement,retirement_age}')::smallint,
    (p_payload #>> '{retirement,planning_end_age}')::smallint,
    (p_payload #>> '{retirement,estimated_annual_spending}')::numeric,
    (p_payload #>> '{retirement,inflation_percent}')::numeric,
    (p_payload #>> '{retirement,investment_return_before_percent}')::numeric,
    (p_payload #>> '{retirement,investment_return_after_percent}')::numeric,
    p_payload #>> '{retirement,expense_mode}',
    (p_payload #>> '{retirement,cpp_enabled}')::boolean,
    (p_payload #>> '{retirement,cpp_annual_estimate}')::numeric,
    (p_payload #>> '{retirement,cpp_start_age}')::smallint,
    (p_payload #>> '{retirement,cpp_taxable}')::boolean,
    (p_payload #>> '{retirement,cpp_annual_growth_percent}')::numeric,
    (p_payload #>> '{retirement,oas_enabled}')::boolean,
    (p_payload #>> '{retirement,oas_annual_estimate}')::numeric,
    (p_payload #>> '{retirement,oas_start_age}')::smallint,
    (p_payload #>> '{retirement,oas_taxable}')::boolean,
    (p_payload #>> '{retirement,oas_annual_growth_percent}')::numeric
  )
  on conflict (plan_id, user_id) do update set
    retirement_age = excluded.retirement_age,
    planning_end_age = excluded.planning_end_age,
    estimated_annual_spending = excluded.estimated_annual_spending,
    inflation_percent = excluded.inflation_percent,
    investment_return_before_percent = excluded.investment_return_before_percent,
    investment_return_after_percent = excluded.investment_return_after_percent,
    expense_mode = excluded.expense_mode,
    cpp_enabled = excluded.cpp_enabled,
    cpp_annual_estimate = excluded.cpp_annual_estimate,
    cpp_start_age = excluded.cpp_start_age,
    cpp_taxable = excluded.cpp_taxable,
    cpp_annual_growth_percent = excluded.cpp_annual_growth_percent,
    oas_enabled = excluded.oas_enabled,
    oas_annual_estimate = excluded.oas_annual_estimate,
    oas_start_age = excluded.oas_start_age,
    oas_taxable = excluded.oas_taxable,
    oas_annual_growth_percent = excluded.oas_annual_growth_percent;

  insert into public.income_sources (
    id, user_id, plan_id, name, income_type, amount, frequency, start_year,
    end_year, annual_growth_percent, taxable, ends_at_retirement, enabled, position
  )
  select
    item.id, v_user_id, item.plan_id, item.name, item.income_type, item.amount,
    item.frequency, item.start_year, item.end_year, item.annual_growth_percent,
    item.taxable, item.ends_at_retirement, item.enabled, item.position
  from jsonb_to_recordset(p_payload -> 'income_sources') as item (
    id uuid, plan_id uuid, name text, income_type text, amount numeric,
    frequency text, start_year smallint, end_year smallint,
    annual_growth_percent numeric, taxable boolean, ends_at_retirement boolean,
    enabled boolean, position integer
  )
  on conflict (id) do update set
    plan_id = excluded.plan_id,
    name = excluded.name,
    income_type = excluded.income_type,
    amount = excluded.amount,
    frequency = excluded.frequency,
    start_year = excluded.start_year,
    end_year = excluded.end_year,
    annual_growth_percent = excluded.annual_growth_percent,
    taxable = excluded.taxable,
    ends_at_retirement = excluded.ends_at_retirement,
    enabled = excluded.enabled,
    position = excluded.position;

  insert into public.expenses (
    id, user_id, plan_id, name, category, amount, frequency, start_year,
    end_year, inflation_percent, enabled, position
  )
  select
    item.id, v_user_id, item.plan_id, item.name, item.category, item.amount,
    item.frequency, item.start_year, item.end_year, item.inflation_percent,
    item.enabled, item.position
  from jsonb_to_recordset(p_payload -> 'expenses') as item (
    id uuid, plan_id uuid, name text, category text, amount numeric,
    frequency text, start_year smallint, end_year smallint,
    inflation_percent numeric, enabled boolean, position integer
  )
  on conflict (id) do update set
    plan_id = excluded.plan_id,
    name = excluded.name,
    category = excluded.category,
    amount = excluded.amount,
    frequency = excluded.frequency,
    start_year = excluded.start_year,
    end_year = excluded.end_year,
    inflation_percent = excluded.inflation_percent,
    enabled = excluded.enabled,
    position = excluded.position;

  insert into public.assets (
    id, user_id, plan_id, name, asset_type, category, current_value,
    expected_return_percent, post_retirement_return_percent,
    annual_appreciation_percent, annual_contribution, contribution_frequency,
    contribution_start_year, contribution_end_year, start_year, enabled, position
  )
  select
    item.id, v_user_id, item.plan_id, item.name, item.asset_type, item.category,
    item.current_value, item.expected_return_percent,
    item.post_retirement_return_percent, item.annual_appreciation_percent,
    item.annual_contribution, item.contribution_frequency,
    item.contribution_start_year, item.contribution_end_year, item.start_year,
    item.enabled, item.position
  from jsonb_to_recordset(p_payload -> 'assets') as item (
    id uuid, plan_id uuid, name text, asset_type text, category text,
    current_value numeric, expected_return_percent numeric,
    post_retirement_return_percent numeric, annual_appreciation_percent numeric,
    annual_contribution numeric, contribution_frequency text,
    contribution_start_year smallint, contribution_end_year smallint,
    start_year smallint, enabled boolean, position integer
  )
  on conflict (id) do update set
    plan_id = excluded.plan_id,
    name = excluded.name,
    asset_type = excluded.asset_type,
    category = excluded.category,
    current_value = excluded.current_value,
    expected_return_percent = excluded.expected_return_percent,
    post_retirement_return_percent = excluded.post_retirement_return_percent,
    annual_appreciation_percent = excluded.annual_appreciation_percent,
    annual_contribution = excluded.annual_contribution,
    contribution_frequency = excluded.contribution_frequency,
    contribution_start_year = excluded.contribution_start_year,
    contribution_end_year = excluded.contribution_end_year,
    start_year = excluded.start_year,
    enabled = excluded.enabled,
    position = excluded.position;

  insert into public.debts (
    id, user_id, plan_id, name, debt_type, balance, annual_interest_percent,
    payment_amount, payment_frequency, remaining_amortization_months,
    extra_payment_amount, compounding_periods_per_year, start_year, enabled, position
  )
  select
    item.id, v_user_id, item.plan_id, item.name, item.debt_type, item.balance,
    item.annual_interest_percent, item.payment_amount, item.payment_frequency,
    item.remaining_amortization_months, item.extra_payment_amount,
    item.compounding_periods_per_year, item.start_year, item.enabled, item.position
  from jsonb_to_recordset(p_payload -> 'debts') as item (
    id uuid, plan_id uuid, name text, debt_type text, balance numeric,
    annual_interest_percent numeric, payment_amount numeric,
    payment_frequency text, remaining_amortization_months integer,
    extra_payment_amount numeric, compounding_periods_per_year integer,
    start_year smallint, enabled boolean, position integer
  )
  on conflict (id) do update set
    plan_id = excluded.plan_id,
    name = excluded.name,
    debt_type = excluded.debt_type,
    balance = excluded.balance,
    annual_interest_percent = excluded.annual_interest_percent,
    payment_amount = excluded.payment_amount,
    payment_frequency = excluded.payment_frequency,
    remaining_amortization_months = excluded.remaining_amortization_months,
    extra_payment_amount = excluded.extra_payment_amount,
    compounding_periods_per_year = excluded.compounding_periods_per_year,
    start_year = excluded.start_year,
    enabled = excluded.enabled,
    position = excluded.position;

  -- Free the per-plan name and baseline uniqueness slots before applying the
  -- exact incoming set. The transaction hides these temporary values, and a
  -- later failure restores the original rows.
  update public.scenarios
  set
    name = '__planner_save__' || id::text,
    is_baseline = false
  where user_id = v_user_id and plan_id = v_plan_id;

  delete from public.scenarios as stored
  where stored.user_id = v_user_id
    and stored.plan_id = v_plan_id
    and not exists (
      select 1
      from jsonb_to_recordset(p_payload -> 'scenarios') as item (id uuid)
      where item.id = stored.id
    );

  insert into public.scenarios (
    id, user_id, plan_id, name, description, is_baseline, is_archived
  )
  select
    item.id, v_user_id, item.plan_id, item.name, item.description,
    item.is_baseline, item.is_archived
  from jsonb_to_recordset(p_payload -> 'scenarios') as item (
    id uuid, plan_id uuid, name text, description text,
    is_baseline boolean, is_archived boolean
  )
  on conflict (id) do update set
    plan_id = excluded.plan_id,
    name = excluded.name,
    description = excluded.description,
    is_baseline = excluded.is_baseline,
    is_archived = excluded.is_archived;

  -- Replacement remains safe because the complete RPC is one transaction. Any
  -- validation, RLS, or network failure rolls this deletion back with the rest.
  delete from public.scenario_overrides
  where user_id = v_user_id and plan_id = v_plan_id;

  insert into public.scenario_overrides (
    id, user_id, plan_id, scenario_id, entity_type, target_id, operation, changes
  )
  select
    item.id, v_user_id, item.plan_id, item.scenario_id, item.entity_type,
    item.target_id, item.operation, item.changes
  from jsonb_to_recordset(p_payload -> 'scenario_overrides') as item (
    id uuid, plan_id uuid, scenario_id uuid, entity_type text,
    target_id uuid, operation text, changes jsonb
  );

  delete from public.income_sources as stored
  where stored.user_id = v_user_id
    and stored.plan_id = v_plan_id
    and not exists (
      select 1
      from jsonb_to_recordset(p_payload -> 'income_sources') as item (id uuid)
      where item.id = stored.id
    );
  delete from public.expenses as stored
  where stored.user_id = v_user_id
    and stored.plan_id = v_plan_id
    and not exists (
      select 1
      from jsonb_to_recordset(p_payload -> 'expenses') as item (id uuid)
      where item.id = stored.id
    );
  delete from public.assets as stored
  where stored.user_id = v_user_id
    and stored.plan_id = v_plan_id
    and not exists (
      select 1
      from jsonb_to_recordset(p_payload -> 'assets') as item (id uuid)
      where item.id = stored.id
    );
  delete from public.debts as stored
  where stored.user_id = v_user_id
    and stored.plan_id = v_plan_id
    and not exists (
      select 1
      from jsonb_to_recordset(p_payload -> 'debts') as item (id uuid)
      where item.id = stored.id
    );
  return v_revision;
end;
$$;

comment on function public.save_planner_snapshot(jsonb, bigint) is
  'Atomically replaces one authenticated user-owned planner snapshot when the optimistic revision matches.';

revoke all on function public.save_planner_snapshot(jsonb, bigint) from public;
revoke all on function public.save_planner_snapshot(jsonb, bigint) from anon;
grant execute on function public.save_planner_snapshot(jsonb, bigint) to authenticated;

commit;
