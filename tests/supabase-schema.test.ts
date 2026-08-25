import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260824010000_planner_foundation.sql',
)
const sql = readFileSync(migrationPath, 'utf8')
const atomicSaveMigrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260825010000_planner_atomic_save.sql',
)
const atomicSaveSql = readFileSync(atomicSaveMigrationPath, 'utf8')

const tables = [
  'profiles',
  'financial_plans',
  'income_sources',
  'expenses',
  'assets',
  'debts',
  'retirement_settings',
  'scenarios',
  'scenario_overrides',
  'financial_goals',
] as const

const planOwnedTables = [
  'income_sources',
  'expenses',
  'assets',
  'debts',
  'retirement_settings',
  'scenarios',
  'scenario_overrides',
  'financial_goals',
] as const

const operations = ['select', 'insert', 'update', 'delete'] as const

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function tableDefinition(table: (typeof tables)[number]) {
  const match = sql.match(
    new RegExp(
      `create\\s+table\\s+public\\.${escapeRegExp(table)}\\s*\\(([\\s\\S]*?)\\n\\);`,
      'i',
    ),
  )

  expect(match, `missing CREATE TABLE for ${table}`).not.toBeNull()
  return match?.[1] ?? ''
}

function policyDefinition(
  table: (typeof tables)[number],
  operation: (typeof operations)[number],
) {
  const policyName = `${table}_${operation}_own`
  const match = sql.match(
    new RegExp(
      `create\\s+policy\\s+${escapeRegExp(policyName)}[\\s\\S]*?;`,
      'i',
    ),
  )

  expect(match, `missing policy ${policyName}`).not.toBeNull()
  return match?.[0] ?? ''
}

describe('Supabase planner foundation migration', () => {
  it.each(tables)('creates %s with UUID ownership and audit timestamps', (table) => {
    const definition = tableDefinition(table)

    expect(definition).toMatch(
      /\bid\s+uuid\s+primary\s+key\s+default\s+gen_random_uuid\(\)/i,
    )
    expect(definition).toMatch(
      /\buser_id\s+uuid\s+not\s+null\s+default\s+auth\.uid\(\)/i,
    )
    expect(definition).toMatch(
      /\bcreated_at\s+timestamptz\s+not\s+null\s+default\s+now\(\)/i,
    )
    expect(definition).toMatch(
      /\bupdated_at\s+timestamptz\s+not\s+null\s+default\s+now\(\)/i,
    )
  })

  it.each(tables)('enables RLS and defines four owner-only policies for %s', (table) => {
    expect(sql).toMatch(
      new RegExp(
        `alter\\s+table\\s+public\\.${escapeRegExp(table)}\\s+enable\\s+row\\s+level\\s+security\\s*;`,
        'i',
      ),
    )

    for (const operation of operations) {
      const policy = policyDefinition(table, operation)

      expect(policy).toMatch(new RegExp(`for\\s+${operation}\\b`, 'i'))
      expect(policy).toMatch(/\bto\s+authenticated\b/i)
      expect(policy).toMatch(/user_id\s*=\s*\(select\s+auth\.uid\(\)\)/i)

      if (operation === 'insert' || operation === 'update') {
        expect(policy).toMatch(/with\s+check\s*\(/i)
      }
    }
  })

  it.each(planOwnedTables)(
    'enforces composite plan and user ownership for %s',
    (table) => {
      const definition = tableDefinition(table)

      expect(definition).toMatch(/\bplan_id\s+uuid\s+not\s+null\b/i)
      expect(definition).toMatch(
        /foreign\s+key\s*\(\s*plan_id\s*,\s*user_id\s*\)[\s\S]*?references\s+public\.financial_plans\s*\(\s*id\s*,\s*user_id\s*\)/i,
      )
    },
  )

  it.each(tables)('maintains updated_at for %s', (table) => {
    expect(sql).toMatch(
      new RegExp(
        `create\\s+trigger\\s+${escapeRegExp(table)}_set_updated_at[\\s\\S]*?before\\s+update\\s+on\\s+public\\.${escapeRegExp(table)}[\\s\\S]*?execute\\s+function\\s+public\\.set_planner_updated_at\\(\\)\\s*;`,
        'i',
      ),
    )
  })

  it('hardens trigger functions with an empty search path', () => {
    for (const functionName of [
      'set_planner_updated_at',
      'create_planner_profile_for_new_user',
    ]) {
      const definition = sql.match(
        new RegExp(
          `create\\s+or\\s+replace\\s+function\\s+public\\.${functionName}\\(\\)[\\s\\S]*?\\$\\$\\s*;`,
          'i',
        ),
      )?.[0]

      expect(definition, `missing function ${functionName}`).toBeDefined()
      expect(definition).toMatch(/set\s+search_path\s*=\s*''/i)
      expect(sql).toMatch(
        new RegExp(
          `revoke\\s+all\\s+on\\s+function\\s+public\\.${functionName}\\(\\)\\s+from\\s+public\\s*;`,
          'i',
        ),
      )
    }
  })

  it('creates and backfills one profile per Auth user', () => {
    expect(sql).toMatch(
      /after\s+insert\s+on\s+auth\.users[\s\S]*?create_planner_profile_for_new_user\(\)/i,
    )
    expect(sql).toMatch(
      /insert\s+into\s+public\.profiles\s*\(\s*user_id\s*,\s*first_name\s*\)[\s\S]*?from\s+auth\.users/i,
    )
  })

  it('stores sparse scenario diffs without mutable ownership metadata', () => {
    const definition = tableDefinition('scenario_overrides')

    expect(definition).toMatch(/\bchanges\s+jsonb\s+not\s+null\s+default\s+'\{\}'::jsonb/i)
    expect(definition).toMatch(/jsonb_typeof\(changes\)\s*=\s*'object'/i)
    expect(definition).toMatch(/operation\s+in\s*\(\s*'add'\s*,\s*'update'\s*,\s*'delete'\s*\)/i)
    expect(definition).toMatch(/'user_id'[\s\S]*?'plan_id'[\s\S]*?'created_at'[\s\S]*?'updated_at'/i)
    expect(definition).toMatch(
      /foreign\s+key\s*\(\s*scenario_id\s*,\s*plan_id\s*,\s*user_id\s*\)[\s\S]*?references\s+public\.scenarios\s*\(\s*id\s*,\s*plan_id\s*,\s*user_id\s*\)/i,
    )
  })

  it('persists every finance-engine input without storing projection outputs', () => {
    const profile = tableDefinition('profiles')
    const plans = tableDefinition('financial_plans')
    const income = tableDefinition('income_sources')
    const expenses = tableDefinition('expenses')
    const assets = tableDefinition('assets')
    const debts = tableDefinition('debts')
    const retirement = tableDefinition('retirement_settings')
    const scenarios = tableDefinition('scenarios')

    expect(profile).toMatch(/\bcurrency_code\s+text\b/i)
    expect(plans).toMatch(/\bschema_version\s+smallint\b/i)
    expect(plans).toMatch(/\beffective_tax_percent\s+numeric\b/i)
    expect(plans).toMatch(/\bgeneral_inflation_percent\s+numeric\b/i)
    expect(income).toMatch(/\bends_at_retirement\s+boolean\b/i)
    expect(income).toMatch(/\benabled\s+boolean\b/i)
    expect(expenses).toMatch(/\benabled\s+boolean\b/i)
    expect(assets).toMatch(/\bcategory\s+text\b/i)
    expect(assets).toMatch(/\bpost_retirement_return_percent\s+numeric\b/i)
    expect(assets).toMatch(/\bcontribution_frequency\s+text\b/i)
    expect(assets).toMatch(/\bstart_year\s+smallint\b/i)
    expect(assets).toMatch(/\benabled\s+boolean\b/i)
    expect(debts).toMatch(/\bcompounding_periods_per_year\s+integer\b/i)
    expect(debts).toMatch(/\bstart_year\s+smallint\b/i)
    expect(debts).toMatch(/\benabled\s+boolean\b/i)
    expect(retirement).toMatch(/\bexpense_mode\s+text\b/i)

    for (const benefit of ['cpp', 'oas']) {
      expect(retirement).toMatch(new RegExp(`\\b${benefit}_enabled\\s+boolean\\b`, 'i'))
      expect(retirement).toMatch(new RegExp(`\\b${benefit}_taxable\\s+boolean\\b`, 'i'))
      expect(retirement).toMatch(
        new RegExp(`\\b${benefit}_annual_growth_percent\\s+numeric\\b`, 'i'),
      )
    }

    expect(scenarios).toMatch(/\bis_baseline\s+boolean\b/i)
    expect(sql).not.toMatch(/create\s+table\s+public\.(?:projection|projection_years)\b/i)
  })

  it('does not embed privileged role names, secrets, or database URLs', () => {
    const privilegedRole = new RegExp(['service', 'role'].join('[_\\s-]+'), 'i')

    expect(sql).not.toMatch(privilegedRole)
    expect(sql).not.toMatch(
      /(?:SUPABASE|POSTGRES|DATABASE)_(?:PASSWORD|SECRET|KEY)\s*=/i,
    )
    expect(sql).not.toMatch(/postgres(?:ql)?:\/\/[^\s]+/i)
    expect(sql).not.toMatch(/\beyJ[A-Za-z0-9_-]{20,}\b/)
  })

  it('keeps cloud data unavailable to public visitors', () => {
    expect(sql).toMatch(
      /revoke\s+all\s+on\s+table[\s\S]*?public\.financial_goals[\s\S]*?from\s+anon\s*;/i,
    )
    expect(sql).toMatch(
      /revoke\s+all\s+on\s+table[\s\S]*?public\.financial_goals[\s\S]*?from\s+authenticated\s*;/i,
    )
    expect(sql).toMatch(
      /grant\s+select\s*,\s*insert\s*,\s*update\s*,\s*delete\s+on\s+table[\s\S]*?to\s+authenticated\s*;/i,
    )
  })
})

describe('Supabase atomic planner save migration', () => {
  it('adds a non-negative optimistic revision without rewriting the foundation', () => {
    expect(atomicSaveSql).toMatch(
      /alter\s+table\s+public\.financial_plans[\s\S]*?add\s+column\s+revision\s+bigint\s+not\s+null\s+default\s+0/i,
    )
    expect(atomicSaveSql).toMatch(/check\s*\(\s*revision\s*>=\s*0\s*\)/i)
    expect(sql).not.toMatch(/\brevision\s+bigint\b/i)
  })

  it('increments revisions for supported and compatible direct plan updates', () => {
    expect(atomicSaveSql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.bump_planner_revision\(\)[\s\S]*?new\.revision\s*=\s*old\.revision\s*\+\s*1/i,
    )
    expect(atomicSaveSql).toMatch(
      /create\s+trigger\s+financial_plans_bump_revision[\s\S]*?before\s+update\s+on\s+public\.financial_plans/i,
    )
  })

  it('defines a hardened authenticated atomic save RPC with conflict detection', () => {
    const definition = atomicSaveSql.match(
      /create\s+or\s+replace\s+function\s+public\.save_planner_snapshot\([\s\S]*?\$\$\s*;/i,
    )?.[0]
    expect(definition).toBeDefined()
    expect(definition).toMatch(/security\s+invoker/i)
    expect(definition).toMatch(/set\s+search_path\s*=\s*''/i)
    expect(definition).toMatch(/auth\.uid\(\)/i)
    expect(definition).toMatch(/revision\s*=\s*p_expected_revision/i)
    expect(definition).toMatch(/planner_revision_conflict/i)
    expect(definition).toMatch(/jsonb_array_length[\s\S]*?5000/i)
    expect(atomicSaveSql).toMatch(
      /revoke\s+all\s+on\s+function\s+public\.save_planner_snapshot\(jsonb,\s*bigint\)\s+from\s+anon/i,
    )
    expect(atomicSaveSql).toMatch(
      /grant\s+execute\s+on\s+function\s+public\.save_planner_snapshot\(jsonb,\s*bigint\)\s+to\s+authenticated/i,
    )
  })

  it('replaces child rows and scenario overrides inside the RPC transaction', () => {
    expect(atomicSaveSql.trimStart()).toMatch(/^--[\s\S]*?\bbegin\s*;/i)
    expect(atomicSaveSql.trimEnd()).toMatch(/commit\s*;$/i)
    for (const table of ['income_sources', 'expenses', 'assets', 'debts', 'scenarios']) {
      expect(atomicSaveSql).toMatch(
        new RegExp(`insert\\s+into\\s+public\\.${table}\\b[\\s\\S]*?on\\s+conflict`, 'i'),
      )
      expect(atomicSaveSql).toMatch(
        new RegExp(`delete\\s+from\\s+public\\.${table}\\b`, 'i'),
      )
    }
    expect(atomicSaveSql).toMatch(
      /delete\s+from\s+public\.scenario_overrides[\s\S]*?insert\s+into\s+public\.scenario_overrides/i,
    )
  })

  it('preserves the original direct authenticated table grants for compatibility', () => {
    expect(sql).toMatch(
      /grant\s+select\s*,\s*insert\s*,\s*update\s*,\s*delete\s+on\s+table[\s\S]*?to\s+authenticated\s*;/i,
    )
    expect(atomicSaveSql).not.toMatch(/revoke[\s\S]*?on\s+table[\s\S]*?from\s+authenticated/i)
  })
})
