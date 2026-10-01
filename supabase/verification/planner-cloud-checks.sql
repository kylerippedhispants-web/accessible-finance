-- Accessible Finance: database verification, never a migration.
-- Run the WHOLE file in one trusted SQL Editor session after all three migrations.
-- Requires postgres/admin privileges only to create rollback-only fictional users
-- and to SET LOCAL ROLE. All application operations run as authenticated or anon.
-- Does not use passwords, API keys, access tokens, email delivery, or real users.
-- Intended for the new dedicated project: review additional auth.users triggers
-- first on any existing project (external webhook side effects cannot roll back).
-- No COMMIT exists in this file. Results are returned before the final ROLLBACK.
-- If interrupted or a tool stops before the last statement, issue ROLLBACK in
-- the same connection, or close that connection. Never resume with COMMIT.

begin;
set local statement_timeout = '90s';
set local lock_timeout = '5s';
set local row_security = on;

create temporary table af_cloud_verification_results (
  check_name text not null,
  status text not null,
  detail text not null
) on commit drop;

do $verification$
declare
  v_tables text[] := array[
    'profiles', 'financial_plans', 'income_sources', 'expenses', 'assets',
    'debts', 'retirement_settings', 'scenarios', 'scenario_overrides', 'financial_goals'
  ];
  v_required text[] := array[
    'profile', 'plan', 'retirement', 'income_sources', 'expenses', 'assets',
    'debts', 'scenarios', 'scenario_overrides'
  ];
  v_results jsonb := '[]'::jsonb;
  v_check text := 'schema, grants, policies, and role safety';
  v_table text;
  v_key text;
  v_privilege text;
  v_count bigint;
  v_affected bigint;
  v_rel oid;
  v_rpc oid;
  v_constraint record;
  v_user_a uuid := gen_random_uuid();
  v_user_b uuid := gen_random_uuid();
  v_user uuid;
  v_plan uuid;
  v_income uuid;
  v_expense uuid;
  v_asset uuid;
  v_debt uuid;
  v_scenario_one uuid;
  v_scenario_two uuid;
  v_override uuid;
  v_label text;
  v_payload jsonb;
  v_payload_a jsonb;
  v_payload_b jsonb;
  v_bad jsonb;
  v_revision bigint;
  v_rejected boolean;
  v_variant integer;
  v_rejection_count integer := 0;
  v_before jsonb;
  v_after jsonb;
  v_rows jsonb;
  v_state text;
  v_message text;
begin
  -- The inner exception block rolls back EVERY fixture/change on a failed check.
  -- It records a FAIL row instead of mistaking a partial run for success.
  begin
    if exists (
      select 1 from pg_roles where rolname in ('authenticated', 'anon')
      and (rolsuper or rolbypassrls)
    ) then
      raise exception 'API roles must not be superusers or bypass RLS';
    end if;
    if (select count(*) from pg_roles where rolname in ('authenticated', 'anon')) <> 2 then
      raise exception 'Supabase authenticated/anon roles are missing';
    end if;
    foreach v_table in array v_tables loop
      v_rel := to_regclass(format('public.%I', v_table));
      if v_rel is null then raise exception 'Missing table: %', v_table; end if;
      if not (select relrowsecurity from pg_class where oid = v_rel) then
        raise exception 'RLS disabled: %', v_table;
      end if;
      if (select pg_get_userbyid(relowner) from pg_class where oid = v_rel) in ('authenticated', 'anon') then
        raise exception 'An API role owns table % and could bypass RLS', v_table;
      end if;
      select count(*) into v_count from pg_policies
      where schemaname = 'public' and tablename = v_table;
      if v_count <> 4 then raise exception 'Expected exactly four policies on %, found %', v_table, v_count; end if;
      foreach v_privilege in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
        select count(*) into v_count from pg_policies
        where schemaname = 'public' and tablename = v_table
          and cmd = v_privilege and roles = array['authenticated']::name[];
        if v_count <> 1 then raise exception 'Unexpected % policy on %', v_privilege, v_table; end if;
        if not has_table_privilege('authenticated', v_rel, v_privilege) then
          raise exception 'Authenticated % grant missing on %', v_privilege, v_table;
        end if;
      end loop;
      foreach v_privilege in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] loop
        if has_table_privilege('anon', v_rel, v_privilege) then
          raise exception 'Anonymous % privilege leaked on %', v_privilege, v_table;
        end if;
      end loop;
      foreach v_privilege in array array['SELECT', 'INSERT', 'UPDATE', 'REFERENCES'] loop
        if has_any_column_privilege('anon', v_rel, v_privilege) then
          raise exception 'Anonymous column % privilege leaked on %', v_privilege, v_table;
        end if;
      end loop;
      foreach v_privilege in array array['TRUNCATE', 'REFERENCES', 'TRIGGER'] loop
        if has_table_privilege('authenticated', v_rel, v_privilege) then
          raise exception 'Unexpected authenticated % privilege on %', v_privilege, v_table;
        end if;
      end loop;
    end loop;
    for v_constraint in
      select * from (values
        ('income_sources', 'income_sources_plan_owner_fk', 'financial_plans'),
        ('expenses', 'expenses_plan_owner_fk', 'financial_plans'),
        ('assets', 'assets_plan_owner_fk', 'financial_plans'),
        ('debts', 'debts_plan_owner_fk', 'financial_plans'),
        ('retirement_settings', 'retirement_settings_plan_owner_fk', 'financial_plans'),
        ('scenarios', 'scenarios_plan_owner_fk', 'financial_plans'),
        ('scenario_overrides', 'scenario_overrides_plan_owner_fk', 'financial_plans'),
        ('financial_goals', 'financial_goals_plan_owner_fk', 'financial_plans'),
        ('scenario_overrides', 'scenario_overrides_scenario_owner_fk', 'scenarios')
      ) as expected(table_name, constraint_name, parent_name)
    loop
      select count(*) into v_count from pg_constraint c
      where c.conrelid = to_regclass(format('public.%I', v_constraint.table_name))
        and c.conname = v_constraint.constraint_name and c.contype = 'f'
        and c.convalidated and c.confrelid = to_regclass(format('public.%I', v_constraint.parent_name))
        and cardinality(c.conkey) = case when v_constraint.parent_name = 'scenarios' then 3 else 2 end;
      if v_count <> 1 then raise exception 'Missing validated ownership constraint: %', v_constraint.constraint_name; end if;
    end loop;
    v_rpc := to_regprocedure('public.save_planner_snapshot(jsonb,bigint)');
    if v_rpc is null then raise exception 'Atomic-save RPC missing'; end if;
    if (select prosecdef from pg_proc where oid = v_rpc) then raise exception 'Atomic-save RPC must use SECURITY INVOKER'; end if;
    if not exists (
      select 1 from pg_proc p, unnest(p.proconfig) setting
      where p.oid = v_rpc and split_part(setting, '=', 1) = 'search_path'
        and replace(split_part(setting, '=', 2), '"', '') = ''
    ) then raise exception 'Atomic-save RPC needs empty search_path'; end if;
    if not has_function_privilege('authenticated', v_rpc, 'EXECUTE')
      or has_function_privilege('anon', v_rpc, 'EXECUTE') then
      raise exception 'Atomic-save EXECUTE grants are incorrect';
    end if;
    if exists (
      select 1 from pg_proc p,
        lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
      where p.oid = v_rpc and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
    ) then raise exception 'Atomic-save RPC is executable by PUBLIC'; end if;
    if not exists (
      select 1 from pg_attribute
      where attrelid = 'public.financial_plans'::regclass and attname = 'revision'
        and atttypid = 'bigint'::regtype and attnotnull and not attisdropped
    ) then raise exception 'Non-null bigint revision is missing'; end if;
    v_results := v_results || jsonb_build_array(jsonb_build_object('check_name', v_check, 'status', 'PASS', 'detail', '10 RLS tables, 40 scoped policies, effective grants, ownership FKs, INVOKER RPC, revision'));

    v_check := 'rollback-only fictional identities and profile trigger';
    if exists (select 1 from auth.users where id in (v_user_a, v_user_b)) then
      raise exception 'Generated fixture ID collision; no existing user may be reused';
    end if;
    insert into auth.users (id, email, raw_user_meta_data)
    values
      (v_user_a, 'af-db-a-' || v_user_a::text || '@example.invalid', '{"first_name":"Fictional A"}'::jsonb),
      (v_user_b, 'af-db-b-' || v_user_b::text || '@example.invalid', '{"first_name":"Fictional B"}'::jsonb);
    if (select count(*) from public.profiles where user_id in (v_user_a, v_user_b)) <> 2 then
      raise exception 'Auth insert did not create both minimal profiles';
    end if;
    v_results := v_results || jsonb_build_array(jsonb_build_object('check_name', v_check, 'status', 'PASS', 'detail', 'Two synthetic identities; no password, valid email, or Auth API request; automatic profile creation passed'));

    v_check := 'two independent authenticated initial atomic saves';
    foreach v_label in array array['A', 'B'] loop
      v_user := case when v_label = 'A' then v_user_a else v_user_b end;
      v_plan := gen_random_uuid(); v_income := gen_random_uuid(); v_expense := gen_random_uuid();
      v_asset := gen_random_uuid(); v_debt := gen_random_uuid();
      v_scenario_one := gen_random_uuid(); v_scenario_two := gen_random_uuid(); v_override := gen_random_uuid();
      v_payload := jsonb_build_object(
        'profile', jsonb_build_object('first_name', 'Fictional ' || v_label, 'province_code', 'ON', 'date_of_birth', '1990-01-01', 'currency_code', 'CAD'),
        'plan', jsonb_build_object('id', v_plan, 'schema_version', 1, 'name', 'Fictional plan ' || v_label, 'base_year', 2026, 'currency_code', 'CAD', 'effective_tax_percent', 20, 'general_inflation_percent', 2, 'is_default', true),
        'retirement', jsonb_build_object('plan_id', v_plan, 'retirement_age', 65, 'planning_end_age', 90, 'estimated_annual_spending', 40000, 'inflation_percent', 2, 'investment_return_before_percent', 5, 'investment_return_after_percent', 4, 'expense_mode', 'replace_recurring', 'cpp_enabled', false, 'cpp_annual_estimate', 0, 'cpp_start_age', 65, 'cpp_taxable', true, 'cpp_annual_growth_percent', 2, 'oas_enabled', false, 'oas_annual_estimate', 0, 'oas_start_age', 65, 'oas_taxable', true, 'oas_annual_growth_percent', 2),
        'income_sources', jsonb_build_array(jsonb_build_object('id', v_income, 'plan_id', v_plan, 'name', 'Fictional salary', 'income_type', 'employment', 'amount', 60000, 'frequency', 'annual', 'start_year', 2026, 'end_year', null, 'annual_growth_percent', 2, 'taxable', true, 'ends_at_retirement', true, 'enabled', true, 'position', 0)),
        'expenses', jsonb_build_array(jsonb_build_object('id', v_expense, 'plan_id', v_plan, 'name', 'Fictional housing', 'category', 'housing', 'amount', 18000, 'frequency', 'annual', 'start_year', 2026, 'end_year', null, 'inflation_percent', 2, 'enabled', true, 'position', 0)),
        'assets', jsonb_build_array(jsonb_build_object('id', v_asset, 'plan_id', v_plan, 'name', 'Fictional savings', 'asset_type', 'tfsa', 'category', 'investment', 'current_value', 10000, 'expected_return_percent', 5, 'post_retirement_return_percent', 4, 'annual_appreciation_percent', null, 'annual_contribution', 0, 'contribution_frequency', 'annual', 'contribution_start_year', 2026, 'contribution_end_year', null, 'start_year', 2026, 'enabled', true, 'position', 0)),
        'debts', jsonb_build_array(jsonb_build_object('id', v_debt, 'plan_id', v_plan, 'name', 'Fictional loan', 'debt_type', 'other', 'balance', 1000, 'annual_interest_percent', 5, 'payment_amount', 100, 'payment_frequency', 'monthly', 'remaining_amortization_months', 12, 'extra_payment_amount', 0, 'compounding_periods_per_year', 12, 'start_year', 2026, 'enabled', true, 'position', 0)),
        'scenarios', jsonb_build_array(
          jsonb_build_object('id', v_scenario_one, 'plan_id', v_plan, 'name', 'Fictional baseline', 'description', 'Database fixture only', 'is_baseline', true, 'is_archived', false),
          jsonb_build_object('id', v_scenario_two, 'plan_id', v_plan, 'name', 'Fictional alternative', 'description', 'Database fixture only', 'is_baseline', false, 'is_archived', false)
        ),
        'scenario_overrides', jsonb_build_array(jsonb_build_object('id', v_override, 'plan_id', v_plan, 'scenario_id', v_scenario_one, 'entity_type', 'expense', 'target_id', v_expense, 'operation', 'update', 'changes', jsonb_build_object('amount', 17000)))
      );
      perform set_config('request.jwt.claim.sub', v_user::text, true);
      perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user, 'role', 'authenticated')::text, true);
      execute 'set local role authenticated';
      if current_user <> 'authenticated' or auth.uid() is distinct from v_user then raise exception 'Role/claim simulation failed'; end if;
      v_revision := public.save_planner_snapshot(v_payload, null);
      if v_revision is distinct from 0 then raise exception 'Initial revision should be zero, got %', v_revision; end if;
      insert into public.financial_goals (plan_id, name, goal_type, target_amount)
      values (v_plan, 'Fictional reserve', 'emergency_fund', 1000);
      foreach v_table in array v_tables loop
        execute format('select count(*) from public.%I where user_id = $1', v_table) into v_count using v_user;
        if v_count < 1 then raise exception 'Initial fixture has no own row in %', v_table; end if;
      end loop;
      execute 'reset role';
      if v_label = 'A' then v_payload_a := v_payload; else v_payload_b := v_payload; end if;
    end loop;
    v_results := v_results || jsonb_build_array(jsonb_build_object('check_name', v_check, 'status', 'PASS', 'detail', 'RPC created both plans at revision 0 and each user has data in all 10 tables'));

    v_check := 'two-user SELECT, UPDATE, DELETE isolation across all ten tables';
    perform set_config('request.jwt.claim.sub', v_user_b::text, true);
    perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    v_before := '{}'::jsonb;
    foreach v_table in array v_tables loop
      execute format('select coalesce(jsonb_agg(to_jsonb(t) order by id), ''[]''::jsonb) from public.%I t where user_id = $1', v_table) into v_rows using v_user_b;
      v_before := jsonb_set(v_before, array[v_table], v_rows);
    end loop;
    foreach v_table in array v_tables loop
      execute format('select count(*) from public.%I where user_id <> $1', v_table) into v_count using v_user_b;
      if v_count <> 0 then raise exception 'User B can SELECT foreign rows from %', v_table; end if;
      execute format('update public.%I set user_id = user_id where user_id = $1', v_table) using v_user_a;
      get diagnostics v_affected = row_count;
      if v_affected <> 0 then raise exception 'User B can UPDATE user A rows in %', v_table; end if;
      execute format('delete from public.%I where user_id = $1', v_table) using v_user_a;
      get diagnostics v_affected = row_count;
      if v_affected <> 0 then raise exception 'User B can DELETE user A rows in %', v_table; end if;
      -- USING protects access to existing foreign rows; WITH CHECK must also
      -- reject changing ownership of an accessible row. Require the RLS error,
      -- not a later unique/FK failure that could otherwise conceal a weak policy.
      v_rejected := false;
      begin
        execute format('update public.%I set user_id = $1 where user_id = $2', v_table) using v_user_a, v_user_b;
      exception when insufficient_privilege then v_rejected := true;
      end;
      if not v_rejected then raise exception 'User B could change its own row owner in %', v_table; end if;
      execute format('select coalesce(jsonb_agg(to_jsonb(t) order by id), ''[]''::jsonb) from public.%I t where user_id = $1', v_table) into v_rows using v_user_b;
      if v_rows is distinct from (v_before -> v_table) then raise exception 'Rejected ownership change altered user B rows in %', v_table; end if;
    end loop;
    v_after := '{}'::jsonb;
    foreach v_table in array v_tables loop
      execute format('select coalesce(jsonb_agg(to_jsonb(t) order by id), ''[]''::jsonb) from public.%I t where user_id = $1', v_table) into v_rows using v_user_b;
      v_after := jsonb_set(v_after, array[v_table], v_rows);
    end loop;
    if v_after is distinct from v_before then raise exception 'Rejected ownership changes altered other user B fixture rows/revision'; end if;
    v_results := v_results || jsonb_build_array(jsonb_build_object('check_name', v_check, 'status', 'PASS', 'detail', 'Only own rows visible; foreign UPDATE/DELETE affect zero rows; own-row owner changes reject with 42501 in all 10 tables; exact fixtures unchanged'));

    v_check := 'owner spoofing, cross-plan attachment, scenario ownership, and cross-user RPC';
    v_rejected := false;
    begin
      insert into public.expenses (user_id, plan_id, name, category, amount, frequency, start_year)
      values (v_user_a, (v_payload_a #>> '{plan,id}')::uuid, 'Rejected owner spoof', 'other', 1, 'annual', 2026);
    exception when insufficient_privilege then v_rejected := true;
    end;
    if not v_rejected then raise exception 'INSERT with spoofed owner was allowed'; end if;
    v_rejected := false;
    begin
      insert into public.expenses (plan_id, name, category, amount, frequency, start_year)
      values ((v_payload_a #>> '{plan,id}')::uuid, 'Rejected foreign plan', 'other', 1, 'annual', 2026);
    exception when foreign_key_violation then v_rejected := true;
    end;
    if not v_rejected then raise exception 'Own row attached to another user plan'; end if;
    v_rejected := false;
    begin
      insert into public.scenario_overrides (plan_id, scenario_id, entity_type, target_id, operation, changes)
      values ((v_payload_b #>> '{plan,id}')::uuid, (v_payload_a #>> '{scenarios,0,id}')::uuid, 'expense', (v_payload_b #>> '{expenses,0,id}')::uuid, 'update', '{"amount":1}'::jsonb);
    exception when foreign_key_violation then v_rejected := true;
    end;
    if not v_rejected then raise exception 'Own override attached to another user scenario'; end if;
    v_rejected := false;
    begin
      perform public.save_planner_snapshot(v_payload_a, 0);
    exception when sqlstate 'P0001' then
      if sqlerrm <> 'planner_revision_conflict' then raise; end if;
      v_rejected := true;
    end;
    if not v_rejected then raise exception 'RPC updated another user plan'; end if;
    v_bad := jsonb_set(v_payload_b, '{income_sources,0,id}', v_payload_a #> '{income_sources,0,id}');
    v_rejected := false;
    begin
      perform public.save_planner_snapshot(v_bad, 0);
    exception when insufficient_privilege then v_rejected := true;
    end;
    if not v_rejected then raise exception 'RPC hijacked another user child ID'; end if;
    select revision into v_revision from public.financial_plans where id = (v_payload_b #>> '{plan,id}')::uuid;
    if v_revision is distinct from 0 then raise exception 'Rejected cross-user write changed user B revision'; end if;
    execute 'reset role';
    v_results := v_results || jsonb_build_array(jsonb_build_object('check_name', v_check, 'status', 'PASS', 'detail', 'RLS, composite foreign keys, and INVOKER upserts reject all cross-owner writes'));

    v_check := 'malformed payload regression: missing/null/wrong shapes leave rows and revision unchanged';
    perform set_config('request.jwt.claim.sub', v_user_a::text, true);
    perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    v_before := '{}'::jsonb;
    foreach v_table in array v_tables loop
      execute format('select coalesce(jsonb_agg(to_jsonb(t) order by id), ''[]''::jsonb) from public.%I t where user_id = $1', v_table) into v_rows using v_user_a;
      v_before := jsonb_set(v_before, array[v_table], v_rows);
    end loop;
    foreach v_key in array v_required loop
      for v_variant in 1..3 loop
        v_bad := case v_variant
          when 1 then v_payload_a - v_key
          when 2 then jsonb_set(v_payload_a, array[v_key], 'null'::jsonb)
          else jsonb_set(v_payload_a, array[v_key], case when v_key in ('profile', 'plan', 'retirement') then '[]'::jsonb else '{}'::jsonb end)
        end;
        v_rejected := false;
        begin
          perform public.save_planner_snapshot(v_bad, 0);
        exception when sqlstate '22023' then
          if sqlerrm <> 'invalid_planner_save_payload' then raise; end if;
          v_rejected := true;
        end;
        if not v_rejected then raise exception 'Malformed field % variant % was accepted', v_key, v_variant; end if;
        v_after := '{}'::jsonb;
        foreach v_table in array v_tables loop
          execute format('select coalesce(jsonb_agg(to_jsonb(t) order by id), ''[]''::jsonb) from public.%I t where user_id = $1', v_table) into v_rows using v_user_a;
          v_after := jsonb_set(v_after, array[v_table], v_rows);
        end loop;
        if v_after is distinct from v_before then raise exception 'Rejected field % variant % changed stored rows/revision', v_key, v_variant; end if;
        v_rejection_count := v_rejection_count + 1;
      end loop;
    end loop;
    foreach v_bad in array array[null::jsonb, 'null'::jsonb, '[]'::jsonb, 'false'::jsonb, '42'::jsonb, '"invalid"'::jsonb] loop
      v_rejected := false;
      begin
        perform public.save_planner_snapshot(v_bad, 0);
      exception when sqlstate '22023' then
        if sqlerrm <> 'invalid_planner_save_payload' then raise; end if;
        v_rejected := true;
      end;
      if not v_rejected then raise exception 'Non-object root payload accepted'; end if;
      v_rejection_count := v_rejection_count + 1;
    end loop;
    v_after := '{}'::jsonb;
    foreach v_table in array v_tables loop
      execute format('select coalesce(jsonb_agg(to_jsonb(t) order by id), ''[]''::jsonb) from public.%I t where user_id = $1', v_table) into v_rows using v_user_a;
      v_after := jsonb_set(v_after, array[v_table], v_rows);
    end loop;
    if v_after is distinct from v_before then raise exception 'Rejected root payload changed stored rows/revision'; end if;
    v_results := v_results || jsonb_build_array(jsonb_build_object('check_name', v_check, 'status', 'PASS', 'detail', v_rejection_count::text || ' malformed requests rejected; exact rows and revision protected'));

    v_check := 'explicit replacement, scenario name/baseline swap, and optimistic revision';
    v_payload_a := jsonb_set(v_payload_a, '{plan,name}', '"Fictional A updated"'::jsonb);
    v_payload_a := jsonb_set(v_payload_a, '{expenses,0,amount}', '16000'::jsonb);
    v_payload_a := jsonb_set(v_payload_a, '{debts}', '[]'::jsonb);
    v_payload_a := jsonb_set(v_payload_a, '{scenarios,0,name}', '"Fictional alternative"'::jsonb);
    v_payload_a := jsonb_set(v_payload_a, '{scenarios,0,is_baseline}', 'false'::jsonb);
    v_payload_a := jsonb_set(v_payload_a, '{scenarios,1,name}', '"Fictional baseline"'::jsonb);
    v_payload_a := jsonb_set(v_payload_a, '{scenarios,1,is_baseline}', 'true'::jsonb);
    v_revision := public.save_planner_snapshot(v_payload_a, 0);
    if v_revision is distinct from 1 then raise exception 'Revision did not advance exactly once'; end if;
    if exists (select 1 from public.debts where user_id = v_user_a) then raise exception 'Explicit empty debt array did not remove owned debt'; end if;
    if (select amount from public.expenses where id = (v_payload_a #>> '{expenses,0,id}')::uuid) is distinct from 16000 then raise exception 'Expense update missing'; end if;
    if not exists (select 1 from public.scenarios where id = (v_payload_a #>> '{scenarios,1,id}')::uuid and is_baseline and name = 'Fictional baseline') then raise exception 'Scenario name/baseline swap failed'; end if;
    v_rejected := false;
    begin
      perform public.save_planner_snapshot(v_payload_a, 0);
    exception when sqlstate 'P0001' then
      if sqlerrm <> 'planner_revision_conflict' then raise; end if;
      v_rejected := true;
    end;
    if not v_rejected then raise exception 'Stale revision accepted'; end if;
    v_rejected := false;
    begin
      perform public.save_planner_snapshot(v_payload_a, null);
    exception when sqlstate 'P0001' then
      if sqlerrm <> 'planner_revision_conflict' then raise; end if;
      v_rejected := true;
    end;
    if not v_rejected then raise exception 'Duplicate initial create accepted'; end if;
    select revision into v_revision from public.financial_plans where id = (v_payload_a #>> '{plan,id}')::uuid;
    if v_revision is distinct from 1 then raise exception 'Conflict changed revision'; end if;
    v_results := v_results || jsonb_build_array(jsonb_build_object('check_name', v_check, 'status', 'PASS', 'detail', 'Explicit [] deletes only own debt, scenario swaps work, revision advances 0→1, stale/duplicate saves reject'));

    v_check := 'late constraint failure rolls back the complete snapshot';
    v_before := '{}'::jsonb;
    foreach v_table in array v_tables loop
      execute format('select coalesce(jsonb_agg(to_jsonb(t) order by id), ''[]''::jsonb) from public.%I t where user_id = $1', v_table) into v_rows using v_user_a;
      v_before := jsonb_set(v_before, array[v_table], v_rows);
    end loop;
    v_bad := jsonb_set(v_payload_a, '{profile,first_name}', '"Must roll back"'::jsonb);
    v_bad := jsonb_set(v_bad, '{expenses,0,amount}', '999'::jsonb);
    v_bad := jsonb_set(v_bad, '{scenario_overrides,0,changes}', jsonb_build_object('user_id', v_user_b));
    v_rejected := false;
    begin
      perform public.save_planner_snapshot(v_bad, 1);
    exception when check_violation then v_rejected := true;
    end;
    if not v_rejected then raise exception 'Immutable scenario identity field accepted'; end if;
    v_after := '{}'::jsonb;
    foreach v_table in array v_tables loop
      execute format('select coalesce(jsonb_agg(to_jsonb(t) order by id), ''[]''::jsonb) from public.%I t where user_id = $1', v_table) into v_rows using v_user_a;
      v_after := jsonb_set(v_after, array[v_table], v_rows);
    end loop;
    if v_after is distinct from v_before then raise exception 'Late failure left partial financial/profile/scenario changes'; end if;
    execute 'reset role';
    v_results := v_results || jsonb_build_array(jsonb_build_object('check_name', v_check, 'status', 'PASS', 'detail', 'Exact equality across all ten tables, including revision, after failure near end of RPC'));

    v_check := 'anonymous access denied and authenticated role without identity rejected';
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    execute 'set local role anon';
    foreach v_table in array v_tables loop
      v_rejected := false;
      begin
        execute format('select count(*) from public.%I', v_table) into v_count;
      exception when insufficient_privilege then v_rejected := true;
      end;
      if not v_rejected then raise exception 'Anonymous SELECT permitted on %', v_table; end if;
    end loop;
    v_rejected := false;
    begin
      perform public.save_planner_snapshot(v_payload_a, 1);
    exception when insufficient_privilege then v_rejected := true;
    end;
    if not v_rejected then raise exception 'Anonymous role could invoke RPC'; end if;
    execute 'reset role';
    perform set_config('request.jwt.claims', '{"role":"authenticated"}', true);
    execute 'set local role authenticated';
    if auth.uid() is not null then raise exception 'Empty synthetic identity did not clear auth.uid()'; end if;
    v_rejected := false;
    begin
      perform public.save_planner_snapshot(v_payload_a, 1);
    exception when sqlstate '28000' then
      if sqlerrm <> 'planner_authentication_required' then raise; end if;
      v_rejected := true;
    end;
    if not v_rejected then raise exception 'RPC accepted authenticated role without identity'; end if;
    execute 'reset role';
    v_results := v_results || jsonb_build_array(jsonb_build_object('check_name', v_check, 'status', 'PASS', 'detail', 'Anon denied all table reads and RPC; missing auth.uid() rejected before writes'));
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_message = message_text;
    v_results := v_results || jsonb_build_array(jsonb_build_object('check_name', v_check, 'status', 'FAIL', 'detail', v_state || ': ' || v_message || '. Fixture changes were rolled back; later checks did not run.'));
  end;

  execute 'reset role';
  insert into af_cloud_verification_results
  select item->>'check_name', item->>'status', item->>'detail'
  from jsonb_array_elements(v_results) item;
  raise notice 'AF_CLOUD_VERIFICATION_RESULT %', v_results;
end;
$verification$;

-- Expected: exactly 9 PASS rows, then the ROLLBACK completion acknowledgement.
-- Any FAIL or fewer rows means database verification is incomplete/failed.
select * from af_cloud_verification_results;
select count(*) = 9 and bool_and(status = 'PASS') as all_database_checks_passed,
  count(*) as checks_completed,
  'All fictional users, profiles, plans, and temporary results are rolled back by the next statement.' as cleanup
from af_cloud_verification_results;

rollback;
