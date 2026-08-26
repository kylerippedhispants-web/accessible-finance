import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import {
  ASSET_TYPES,
  DEBT_TYPES,
  EXPENSE_CATEGORIES,
  FREQUENCIES,
  INCOME_TYPES,
  type Asset,
  type AssetType,
  type Debt,
  type DebtType,
  type Expense,
  type ExpenseCategory,
  type Frequency,
  type IncomeSource,
  type IncomeType,
  type RecurringFrequency,
} from '../domain';
import { MoneyField, NumberField, PercentField, SelectField, TextField, ToggleField } from '../components/FormFields';
import { createEntityId } from '../data/demoPlan';
import { formatCad, formatPercent as formatPercentValue } from '../lib/formatters';
import { usePlanner, type PlannerMode } from '../state/PlannerContext';

type SelectOption = { value: string; label: string };

type IncomeDraft = Omit<IncomeSource, 'amount' | 'startYear' | 'annualGrowthPercent'> & {
  amount: number | undefined;
  startYear: number | undefined;
  annualGrowthPercent: number | undefined;
};

type ExpenseDraft = Omit<Expense, 'amount' | 'startYear' | 'inflationPercent'> & {
  amount: number | undefined;
  startYear: number | undefined;
  inflationPercent: number | undefined;
};

type AssetDraft = Omit<Asset, 'currentValue'> & {
  currentValue: number | undefined;
};

type DebtDraft = Omit<
  Debt,
  'balance' | 'annualInterestPercent' | 'paymentAmount' | 'remainingAmortizationMonths'
> & {
  balance: number | undefined;
  annualInterestPercent: number | undefined;
  paymentAmount: number | undefined;
  remainingAmortizationMonths: number | undefined;
};

interface EditorState<T> {
  mode: 'add' | 'edit';
  draft: T;
}

const incomeTypeLabels: Record<IncomeType, string> = {
  employment: 'Employment',
  self_employment: 'Self-employment',
  rental_income: 'Rental income',
  pension: 'Pension',
  government_benefit: 'Government benefits',
  investment_income: 'Investment income',
  other: 'Other income',
  one_time: 'One-time income',
};

const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  housing: 'Housing',
  food: 'Food',
  transportation: 'Transportation',
  utilities: 'Utilities',
  insurance: 'Insurance',
  travel: 'Travel',
  entertainment: 'Entertainment',
  healthcare: 'Healthcare',
  childcare: 'Childcare',
  education: 'Education',
  subscriptions: 'Subscriptions',
  other: 'Other expense',
  one_time: 'One-time expense',
};

const assetTypeLabels: Record<AssetType, string> = {
  chequing: 'Chequing account',
  savings: 'Savings account',
  cash: 'Cash',
  tfsa: 'TFSA',
  rrsp: 'RRSP',
  fhsa: 'FHSA',
  resp: 'RESP',
  rrif: 'RRIF',
  non_registered_investment: 'Non-registered investment',
  primary_residence: 'Primary residence',
  rental_property: 'Rental property',
  pension: 'Pension asset',
  other: 'Other asset',
};

const debtTypeLabels: Record<DebtType, string> = {
  mortgage: 'Mortgage',
  heloc: 'Home equity line of credit (HELOC)',
  line_of_credit: 'Line of credit',
  credit_card: 'Credit card',
  car_loan: 'Car loan',
  student_loan: 'Student loan',
  personal_loan: 'Personal loan',
  other: 'Other debt',
};

const frequencyLabels: Record<Frequency, string> = {
  monthly: 'Monthly',
  biweekly: 'Biweekly (26 times a year)',
  annual: 'Annual',
  one_time: 'One time',
};

const incomeTypeOptions = makeOptions(INCOME_TYPES, incomeTypeLabels);
const expenseCategoryOptions = makeOptions(EXPENSE_CATEGORIES, expenseCategoryLabels);
const assetTypeOptions = makeOptions(ASSET_TYPES, assetTypeLabels);
const debtTypeOptions = makeOptions(DEBT_TYPES, debtTypeLabels);
const frequencyOptions = makeOptions(FREQUENCIES, frequencyLabels);
const recurringFrequencyOptions: readonly SelectOption[] = [
  { value: 'monthly', label: frequencyLabels.monthly },
  { value: 'biweekly', label: frequencyLabels.biweekly },
  { value: 'annual', label: frequencyLabels.annual },
];

const propertyAssetTypes: readonly AssetType[] = ['primary_residence', 'rental_property'];
const earnedIncomeTypes: readonly IncomeType[] = ['employment', 'self_employment'];

function makeOptions<T extends string>(values: readonly T[], labels: Record<T, string>): SelectOption[] {
  return values.map((value) => ({ value, label: labels[value] }));
}

function formatMoney(value: number): string {
  return formatCad(value);
}

function formatPercent(value: number | undefined): string {
  return value === undefined ? 'Default' : formatPercentValue(value, 2);
}

function isFiniteNumber(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value);
}

function validMoney(value: number | undefined): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 1_000_000_000_000;
}

function validPercentage(value: number | undefined, allowNegative = true): value is number {
  if (!isFiniteNumber(value)) return false;
  return value <= 100 && value >= (allowNegative ? -100 : 0);
}

function validYear(value: number | undefined): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 1900 && value <= 2200;
}

function validOptionalYear(value: number | undefined): boolean {
  return value === undefined || validYear(value);
}

function isPropertyAsset(type: AssetType): boolean {
  return propertyAssetTypes.includes(type);
}

function isEarnedIncome(type: IncomeType): boolean {
  return earnedIncomeTypes.includes(type);
}

function canReplaceEditor(editorOpen: boolean): boolean {
  return !editorOpen || window.confirm('Discard the unsubmitted changes in the open form?');
}

interface CollectionHeaderProps {
  headingId: string;
  eyebrow: string;
  title: string;
  description: string;
  count: number;
  singular: string;
  addLabel: string;
  onAdd: () => void;
}

function CollectionHeader({
  headingId,
  eyebrow,
  title,
  description,
  count,
  singular,
  addLabel,
  onAdd,
}: CollectionHeaderProps) {
  return (
    <header className="collection-header">
      <div className="collection-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h1 id={headingId}>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="collection-toolbar">
        <span className="collection-count" aria-live="polite">
          {count} {count === 1 ? singular : `${singular}s`}
        </span>
        <button className="button button-primary" type="button" onClick={onAdd}>
          {addLabel}
        </button>
      </div>
    </header>
  );
}

function PrivacyNotice({ mode }: { mode: PlannerMode | null }) {
  return (
    <aside className="collection-privacy notice" aria-label="How these changes are saved">
      <strong>Review first, then save.</strong>
      <span>
        Submit an item to add it to this plan, then use <strong>Save changes</strong> in the header.
        {' '}{mode === 'demo'
          ? 'Demo changes stay in this browser session and are never uploaded.'
          : 'Cloud saving sends these inputs to your private Supabase plan; amounts are not sent to analytics.'}
      </span>
    </aside>
  );
}

type CollectionGuidanceKind = 'income' | 'expenses' | 'assets' | 'debts';

interface GuidanceItem {
  title: string;
  body: string;
}

interface GuidanceContent {
  heading: string;
  items: readonly [GuidanceItem, GuidanceItem, GuidanceItem];
}

export const COLLECTION_GUIDANCE: Record<CollectionGuidanceKind, GuidanceContent> = {
  income: {
    heading: 'Build a cleaner income picture',
    items: [
      {
        title: 'What to include',
        body: 'Add each recurring source using the amount for its selected frequency: employment pay, net self-employment or rental income, pensions, benefits, and other cash income. Add unusual receipts as one-time income.',
      },
      {
        title: 'How it is modeled',
        body: 'The selected frequency is annualized. Timing, annual growth, retirement treatment, and the plan\u2019s effective tax rate determine when and how much is counted.',
      },
      {
        title: 'Avoid double counting',
        body: 'Do not enter transfers or unrealized investment growth as income. If returns stay invested and are already captured by an asset assumption, do not add them again.',
      },
    ],
  },
  expenses: {
    heading: 'Build a cleaner spending picture',
    items: [
      {
        title: 'What to include',
        body: 'Use ordinary current spending for each payment period, plus material one-time costs in the year you expect them. Include irregular essentials a monthly budget can miss.',
      },
      {
        title: 'How it is modeled',
        body: 'Recurring amounts are annualized and adjusted by each item\u2019s inflation setting between its start and end years. One-time costs are counted once.',
      },
      {
        title: 'Avoid double counting',
        body: 'Exclude payments already listed under Debts and savings transfers captured as asset contributions. Do not combine an all-in budget with the same detailed categories.',
      },
    ],
  },
  assets: {
    heading: 'Build a cleaner asset picture',
    items: [
      {
        title: 'What to include',
        body: 'Add each account or property once using its current balance or market value. Keep registered account types separate when their assumptions differ.',
      },
      {
        title: 'How it is modeled',
        body: 'Investments use the entered or plan-default return, and contributions are limited by projected cash available. Property uses its appreciation setting.',
      },
      {
        title: 'Avoid double counting',
        body: 'Do not enter both an account total and its individual holdings. Record property at gross value and its mortgage under Debts instead of subtracting the mortgage twice.',
      },
    ],
  },
  debts: {
    heading: 'Build a cleaner debt picture',
    items: [
      {
        title: 'What to include',
        body: 'Use current lender balances, annual rates, regular payments for the selected frequency, remaining months, and any extra amount paid with each regular payment.',
      },
      {
        title: 'How it is modeled',
        body: 'The projection accrues interest and applies scheduled and extra payments. A zero regular payment is calculated from the amortization, with any unpaid balance due at its end.',
      },
      {
        title: 'Avoid double counting',
        body: 'Do not also enter modeled debt payments as Expenses. For a mortgaged property, keep the full property value in Assets and the outstanding mortgage here.',
      },
    ],
  },
};

export function CollectionGuidance({ kind }: { kind: CollectionGuidanceKind }) {
  const guidance = COLLECTION_GUIDANCE[kind];
  const headingId = `${kind}-guidance-title`;

  return (
    <section className="dashboard-insights collection-guidance" aria-labelledby={headingId}>
      <div className="insights-heading">
        <span className="eyebrow">Input guide</span>
        <h2 id={headingId}>{guidance.heading}</h2>
      </div>
      <ul>
        {guidance.items.map((item, index) => (
          <li key={item.title}>
            <span aria-hidden="true">{index + 1}</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface EditorPanelProps {
  title: string;
  description: string;
  submitLabel: string;
  error?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  children: ReactNode;
}

function EditorPanel({
  title,
  description,
  submitLabel,
  error,
  onSubmit,
  onCancel,
  children,
}: EditorPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className="entity-editor" aria-labelledby="entity-editor-title">
      <div className="entity-editor-heading">
        <div>
          <h2 id="entity-editor-title" ref={headingRef} tabIndex={-1}>{title}</h2>
          <p>{description}</p>
        </div>
        <button className="button button-quiet" type="button" onClick={onCancel}>Close</button>
      </div>
      <form onSubmit={onSubmit} noValidate>
        {children}
        {error && <p className="form-status error" role="alert">{error}</p>}
        <div className="form-actions">
          <button className="button button-primary" type="submit">{submitLabel}</button>
          <button className="button button-secondary" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}

interface EntityCardProps {
  name: string;
  typeLabel: string;
  enabled: boolean;
  metrics: readonly { label: string; value: string }[];
  editLabel: string;
  deleteLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}

function EntityCard({
  name,
  typeLabel,
  enabled,
  metrics,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: EntityCardProps) {
  return (
    <article className={`entity-card${enabled ? '' : ' entity-disabled'}`}>
      <div className="entity-card-header">
        <div>
          <span className="entity-kicker">{typeLabel}</span>
          <h3>{name}</h3>
        </div>
        <span className={`status-pill ${enabled ? 'enabled' : 'disabled'}`}>
          {enabled ? 'Included' : 'Excluded'}
        </span>
      </div>
      <dl className="entity-metrics">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>
      <div className="entity-actions">
        <button className="button button-secondary button-small" type="button" onClick={onEdit} aria-label={editLabel}>
          Edit
        </button>
        <button className="button button-danger button-small" type="button" onClick={onDelete} aria-label={deleteLabel}>
          Delete
        </button>
      </div>
    </article>
  );
}

function EmptyState({ title, body, actionLabel, onAction }: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="collection-empty">
      <span className="empty-mark" aria-hidden="true">+</span>
      <h2>{title}</h2>
      <p>{body}</p>
      <button className="button button-secondary" type="button" onClick={onAction}>{actionLabel}</button>
    </div>
  );
}

function MissingPlan({ section }: { section: string }) {
  return (
    <section className="collection-page" aria-labelledby="missing-plan-title">
      <div className="collection-empty" role="status">
        <h1 id="missing-plan-title">Your {section} could not be opened.</h1>
        <p>Return to the planner dashboard and try again.</p>
      </div>
    </section>
  );
}

export function IncomePage() {
  const planner = usePlanner();
  const plan = planner.snapshot?.plan;
  const [editor, setEditor] = useState<EditorState<IncomeDraft> | null>(null);
  const [error, setError] = useState<string>();

  if (!plan) return <MissingPlan section="income plan" />;

  const openAdd = () => {
    if (!canReplaceEditor(editor !== null)) return;
    setError(undefined);
    setEditor({
      mode: 'add',
      draft: {
        id: createEntityId('income'),
        planId: plan.id,
        position: plan.incomeSources.length,
        name: '',
        enabled: true,
        type: 'employment',
        amount: undefined,
        frequency: 'annual',
        startYear: plan.baseYear,
        endYear: undefined,
        annualGrowthPercent: 0,
        taxable: true,
        endsAtRetirement: true,
      },
    });
  };

  const openEdit = (item: IncomeSource) => {
    if (!canReplaceEditor(editor !== null)) return;
    setError(undefined);
    setEditor({ mode: 'edit', draft: { ...item } });
  };

  const remove = (item: IncomeSource) => {
    if (!window.confirm(`Delete "${item.name}" from this plan? This is not permanent until you choose Save changes.`)) return;
    planner.updatePlan((current) => ({
      ...current,
      incomeSources: current.incomeSources
        .filter((candidate) => candidate.id !== item.id)
        .map((candidate, position) => ({ ...candidate, position })),
    }));
    if (editor?.draft.id === item.id) setEditor(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;
    const draft = editor.draft;
    const name = draft.name.trim();
    const oneTime = draft.type === 'one_time' || draft.frequency === 'one_time';
    if (!name) return setError('Enter a name for this income source.');
    if (!validMoney(draft.amount)) return setError('Enter an amount of zero or more.');
    if (!validYear(draft.startYear)) return setError('Enter a start year from 1900 to 2200.');
    if (!oneTime && !validOptionalYear(draft.endYear)) return setError('Enter a valid end year or leave it blank.');
    if (!oneTime && draft.endYear !== undefined && draft.endYear < draft.startYear) {
      return setError('End year must be the same as or later than the start year.');
    }
    if (!oneTime && !validPercentage(draft.annualGrowthPercent)) {
      return setError('Annual growth must be between -100% and 100%.');
    }

    const item: IncomeSource = {
      ...draft,
      name,
      amount: draft.amount,
      startYear: draft.startYear,
      type: oneTime ? 'one_time' : draft.type,
      frequency: oneTime ? 'one_time' : draft.frequency,
      endYear: oneTime ? draft.startYear : draft.endYear,
      annualGrowthPercent: oneTime ? 0 : (draft.annualGrowthPercent ?? 0),
      endsAtRetirement: oneTime ? false : draft.endsAtRetirement,
    };
    planner.updatePlan((current) => ({
      ...current,
      incomeSources: editor.mode === 'add'
        ? [...current.incomeSources, item]
        : current.incomeSources.map((candidate) => candidate.id === item.id ? item : candidate),
    }));
    setEditor(null);
    setError(undefined);
  };

  const updateDraft = (next: IncomeDraft) => {
    setError(undefined);
    setEditor((current) => current ? { ...current, draft: next } : current);
  };
  const selectType = (value: string) => {
    if (!editor) return;
    const type = value as IncomeType;
    const oneTime = type === 'one_time';
    updateDraft({
      ...editor.draft,
      type,
      frequency: oneTime ? 'one_time' : (editor.draft.frequency === 'one_time' ? 'annual' : editor.draft.frequency),
      endYear: oneTime ? undefined : editor.draft.endYear,
      annualGrowthPercent: oneTime ? 0 : editor.draft.annualGrowthPercent,
      endsAtRetirement: oneTime ? false : isEarnedIncome(type),
    });
  };
  const selectFrequency = (value: string) => {
    if (!editor) return;
    const frequency = value as Frequency;
    const oneTime = frequency === 'one_time';
    updateDraft({
      ...editor.draft,
      frequency,
      type: oneTime ? 'one_time' : (editor.draft.type === 'one_time' ? 'other' : editor.draft.type),
      endYear: oneTime ? undefined : editor.draft.endYear,
      annualGrowthPercent: oneTime ? 0 : editor.draft.annualGrowthPercent,
      endsAtRetirement: oneTime ? false : editor.draft.endsAtRetirement,
    });
  };

  return (
    <section className="collection-page income-page" aria-labelledby="income-page-title">
      <CollectionHeader
        headingId="income-page-title"
        eyebrow="Cash coming in"
        title="Income"
        description="Add recurring and one-time income. Amounts are converted to annual values for projections."
        count={plan.incomeSources.length}
        singular="source"
        addLabel="Add income"
        onAdd={openAdd}
      />
      <PrivacyNotice mode={planner.mode} />

      {editor && (
        <EditorPanel
          title={editor.mode === 'add' ? 'Add income source' : `Edit ${editor.draft.name}`}
          description="This form updates the plan in memory. The header Save button controls cloud or session persistence."
          submitLabel={editor.mode === 'add' ? 'Add to plan' : 'Update in plan'}
          error={error}
          onSubmit={submit}
          onCancel={() => { setEditor(null); setError(undefined); }}
        >
          <fieldset className="form-section">
            <legend>Income details</legend>
            <div className="form-grid two">
              <TextField label="Income name" value={editor.draft.name} maxLength={120} required onChange={(name) => updateDraft({ ...editor.draft, name })} />
              <SelectField label="Income type" value={editor.draft.type} options={incomeTypeOptions} onChange={selectType} />
              <MoneyField label="Amount" required min={0} max={1_000_000_000_000} step="0.01" value={editor.draft.amount} onChange={(amount) => updateDraft({ ...editor.draft, amount })} hint="Enter the amount for each selected payment period." />
              <SelectField label="Frequency" value={editor.draft.frequency} options={frequencyOptions} onChange={selectFrequency} hint="Biweekly means 26 payments per year." />
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>{editor.draft.frequency === 'one_time' ? 'Timing' : 'Projection timing'}</legend>
            <div className="form-grid three">
              <NumberField
                label={editor.draft.frequency === 'one_time' ? 'Year received' : 'Start year'}
                required
                min={1900}
                max={2200}
                step={1}
                value={editor.draft.startYear}
                onChange={(startYear) => updateDraft({ ...editor.draft, startYear })}
              />
              {editor.draft.frequency !== 'one_time' && (
                <>
                  <NumberField label="End year (optional)" min={1900} max={2200} step={1} value={editor.draft.endYear} onChange={(endYear) => updateDraft({ ...editor.draft, endYear })} hint="Leave blank to continue through the planning horizon." />
                  <PercentField label="Annual growth" required min={-100} max={100} step="0.1" value={editor.draft.annualGrowthPercent} onChange={(annualGrowthPercent) => updateDraft({ ...editor.draft, annualGrowthPercent })} hint="Use 0 if the amount stays flat." />
                </>
              )}
            </div>
          </fieldset>

          <fieldset className="form-section toggle-section">
            <legend>Projection treatment</legend>
            <ToggleField label="Taxable income" checked={editor.draft.taxable} onChange={(taxable) => updateDraft({ ...editor.draft, taxable })} hint="The planner applies only the effective tax rate you enter; it does not calculate Canadian tax brackets." />
            {editor.draft.frequency !== 'one_time' && (
              <ToggleField label="End this income at retirement" checked={editor.draft.endsAtRetirement ?? isEarnedIncome(editor.draft.type)} onChange={(endsAtRetirement) => updateDraft({ ...editor.draft, endsAtRetirement })} hint="Useful for employment and self-employment income." />
            )}
            <ToggleField label="Include in projections" checked={editor.draft.enabled !== false} onChange={(enabled) => updateDraft({ ...editor.draft, enabled })} hint="Turn this off to keep the item without counting it." />
          </fieldset>
        </EditorPanel>
      )}

      <CollectionGuidance kind="income" />

      {plan.incomeSources.length === 0 ? (
        <EmptyState title="No income sources yet" body="Add employment, pension, benefits, investment income, or a one-time amount." actionLabel="Add your first income source" onAction={openAdd} />
      ) : (
        <section className="collection-list-section" aria-labelledby="income-list-title">
          <h2 id="income-list-title">Income in this plan</h2>
          <ul className="collection-list">
            {plan.incomeSources.map((item) => (
              <li key={item.id}>
                <EntityCard
                  name={item.name}
                  typeLabel={incomeTypeLabels[item.type]}
                  enabled={item.enabled !== false}
                  metrics={[
                    { label: 'Amount', value: `${formatMoney(item.amount)} ${frequencyLabels[item.frequency].toLowerCase()}` },
                    { label: item.frequency === 'one_time' ? 'Year' : 'Starts', value: item.startYear.toString() },
                    { label: 'Tax treatment', value: item.taxable ? 'Taxable' : 'Not taxable' },
                  ]}
                  editLabel={`Edit income source ${item.name}`}
                  deleteLabel={`Delete income source ${item.name}`}
                  onEdit={() => openEdit(item)}
                  onDelete={() => remove(item)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

export function ExpensesPage() {
  const planner = usePlanner();
  const plan = planner.snapshot?.plan;
  const [editor, setEditor] = useState<EditorState<ExpenseDraft> | null>(null);
  const [error, setError] = useState<string>();

  if (!plan) return <MissingPlan section="expense plan" />;

  const openAdd = () => {
    if (!canReplaceEditor(editor !== null)) return;
    setError(undefined);
    setEditor({
      mode: 'add',
      draft: {
        id: createEntityId('expense'),
        planId: plan.id,
        position: plan.expenses.length,
        name: '',
        enabled: true,
        category: 'housing',
        amount: undefined,
        frequency: 'monthly',
        startYear: plan.baseYear,
        endYear: undefined,
        inflationPercent: plan.assumptions.generalInflationPercent,
      },
    });
  };

  const openEdit = (item: Expense) => {
    if (!canReplaceEditor(editor !== null)) return;
    setError(undefined);
    setEditor({ mode: 'edit', draft: { ...item } });
  };

  const remove = (item: Expense) => {
    if (!window.confirm(`Delete "${item.name}" from this plan? This is not permanent until you choose Save changes.`)) return;
    planner.updatePlan((current) => ({
      ...current,
      expenses: current.expenses
        .filter((candidate) => candidate.id !== item.id)
        .map((candidate, position) => ({ ...candidate, position })),
    }));
    if (editor?.draft.id === item.id) setEditor(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;
    const draft = editor.draft;
    const name = draft.name.trim();
    const oneTime = draft.category === 'one_time' || draft.frequency === 'one_time';
    if (!name) return setError('Enter a name for this expense.');
    if (!validMoney(draft.amount)) return setError('Enter an amount of zero or more.');
    if (!validYear(draft.startYear)) return setError('Enter a start year from 1900 to 2200.');
    if (!oneTime && !validOptionalYear(draft.endYear)) return setError('Enter a valid end year or leave it blank.');
    if (!oneTime && draft.endYear !== undefined && draft.endYear < draft.startYear) {
      return setError('End year must be the same as or later than the start year.');
    }
    if (!oneTime && !validPercentage(draft.inflationPercent)) {
      return setError('Inflation must be between -100% and 100%.');
    }

    const item: Expense = {
      ...draft,
      name,
      amount: draft.amount,
      startYear: draft.startYear,
      category: oneTime ? 'one_time' : draft.category,
      frequency: oneTime ? 'one_time' : draft.frequency,
      endYear: oneTime ? draft.startYear : draft.endYear,
      inflationPercent: oneTime ? 0 : (draft.inflationPercent ?? 0),
    };
    planner.updatePlan((current) => ({
      ...current,
      expenses: editor.mode === 'add'
        ? [...current.expenses, item]
        : current.expenses.map((candidate) => candidate.id === item.id ? item : candidate),
    }));
    setEditor(null);
    setError(undefined);
  };

  const updateDraft = (next: ExpenseDraft) => {
    setError(undefined);
    setEditor((current) => current ? { ...current, draft: next } : current);
  };
  const selectCategory = (value: string) => {
    if (!editor) return;
    const category = value as ExpenseCategory;
    const oneTime = category === 'one_time';
    updateDraft({
      ...editor.draft,
      category,
      frequency: oneTime ? 'one_time' : (editor.draft.frequency === 'one_time' ? 'monthly' : editor.draft.frequency),
      endYear: oneTime ? undefined : editor.draft.endYear,
      inflationPercent: oneTime ? 0 : editor.draft.inflationPercent,
    });
  };
  const selectFrequency = (value: string) => {
    if (!editor) return;
    const frequency = value as Frequency;
    const oneTime = frequency === 'one_time';
    updateDraft({
      ...editor.draft,
      frequency,
      category: oneTime ? 'one_time' : (editor.draft.category === 'one_time' ? 'other' : editor.draft.category),
      endYear: oneTime ? undefined : editor.draft.endYear,
      inflationPercent: oneTime ? 0 : editor.draft.inflationPercent,
    });
  };

  return (
    <section className="collection-page expenses-page" aria-labelledby="expenses-page-title">
      <CollectionHeader
        headingId="expenses-page-title"
        eyebrow="Cash going out"
        title="Expenses"
        description="Organize recurring costs and one-time spending. Exclude loan and mortgage payments modeled under Debts so they are not counted twice."
        count={plan.expenses.length}
        singular="expense"
        addLabel="Add expense"
        onAdd={openAdd}
      />
      <PrivacyNotice mode={planner.mode} />

      {editor && (
        <EditorPanel
          title={editor.mode === 'add' ? 'Add expense' : `Edit ${editor.draft.name}`}
          description="Use the amount for the selected frequency. The projection annualizes recurring expenses and handles modeled debt payments separately."
          submitLabel={editor.mode === 'add' ? 'Add to plan' : 'Update in plan'}
          error={error}
          onSubmit={submit}
          onCancel={() => { setEditor(null); setError(undefined); }}
        >
          <fieldset className="form-section">
            <legend>Expense details</legend>
            <div className="form-grid two">
              <TextField label="Expense name" value={editor.draft.name} maxLength={120} required onChange={(name) => updateDraft({ ...editor.draft, name })} />
              <SelectField label="Category" value={editor.draft.category} options={expenseCategoryOptions} onChange={selectCategory} />
              <MoneyField label="Amount" required min={0} max={1_000_000_000_000} step="0.01" value={editor.draft.amount} onChange={(amount) => updateDraft({ ...editor.draft, amount })} hint="Enter the amount for each selected payment period." />
              <SelectField label="Frequency" value={editor.draft.frequency} options={frequencyOptions} onChange={selectFrequency} hint="Biweekly means 26 payments per year." />
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>{editor.draft.frequency === 'one_time' ? 'Timing' : 'Projection timing'}</legend>
            <div className="form-grid three">
              <NumberField
                label={editor.draft.frequency === 'one_time' ? 'Year paid' : 'Start year'}
                required
                min={1900}
                max={2200}
                step={1}
                value={editor.draft.startYear}
                onChange={(startYear) => updateDraft({ ...editor.draft, startYear })}
              />
              {editor.draft.frequency !== 'one_time' && (
                <>
                  <NumberField label="End year (optional)" min={1900} max={2200} step={1} value={editor.draft.endYear} onChange={(endYear) => updateDraft({ ...editor.draft, endYear })} hint="Leave blank to continue through the planning horizon." />
                  <PercentField label="Annual inflation" required min={-100} max={100} step="0.1" value={editor.draft.inflationPercent} onChange={(inflationPercent) => updateDraft({ ...editor.draft, inflationPercent })} hint="Set your own assumption; the planner does not guess future inflation." />
                </>
              )}
            </div>
          </fieldset>

          <fieldset className="form-section toggle-section">
            <legend>Projection treatment</legend>
            <ToggleField label="Include in projections" checked={editor.draft.enabled !== false} onChange={(enabled) => updateDraft({ ...editor.draft, enabled })} hint="Turn this off to keep the item without counting it." />
          </fieldset>
        </EditorPanel>
      )}

      <CollectionGuidance kind="expenses" />

      {plan.expenses.length === 0 ? (
        <EmptyState title="No detailed expenses yet" body="Add housing, food, transportation, subscriptions, or a one-time cost." actionLabel="Add your first expense" onAction={openAdd} />
      ) : (
        <section className="collection-list-section" aria-labelledby="expenses-list-title">
          <h2 id="expenses-list-title">Expenses in this plan</h2>
          <ul className="collection-list">
            {plan.expenses.map((item) => (
              <li key={item.id}>
                <EntityCard
                  name={item.name}
                  typeLabel={expenseCategoryLabels[item.category]}
                  enabled={item.enabled !== false}
                  metrics={[
                    { label: 'Amount', value: `${formatMoney(item.amount)} ${frequencyLabels[item.frequency].toLowerCase()}` },
                    { label: item.frequency === 'one_time' ? 'Year' : 'Starts', value: item.startYear.toString() },
                    { label: 'Inflation', value: item.frequency === 'one_time' ? 'Not applied' : `${formatPercent(item.inflationPercent)} yearly` },
                  ]}
                  editLabel={`Edit expense ${item.name}`}
                  deleteLabel={`Delete expense ${item.name}`}
                  onEdit={() => openEdit(item)}
                  onDelete={() => remove(item)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

export function AssetsPage() {
  const planner = usePlanner();
  const plan = planner.snapshot?.plan;
  const [editor, setEditor] = useState<EditorState<AssetDraft> | null>(null);
  const [error, setError] = useState<string>();

  if (!plan) return <MissingPlan section="asset plan" />;

  const openAdd = () => {
    if (!canReplaceEditor(editor !== null)) return;
    setError(undefined);
    setEditor({
      mode: 'add',
      draft: {
        id: createEntityId('asset'),
        planId: plan.id,
        position: plan.assets.length,
        name: '',
        enabled: true,
        type: 'tfsa',
        currentValue: undefined,
        expectedReturnPercent: plan.retirement.investmentReturnBeforeRetirementPercent,
        postRetirementReturnPercent: plan.retirement.investmentReturnAfterRetirementPercent,
        annualContribution: 0,
        contributionFrequency: 'monthly',
        contributionStartYear: plan.baseYear,
        contributionEndYear: undefined,
        startYear: plan.baseYear,
      },
    });
  };

  const openEdit = (item: Asset) => {
    if (!canReplaceEditor(editor !== null)) return;
    setError(undefined);
    setEditor({ mode: 'edit', draft: { ...item } });
  };

  const remove = (item: Asset) => {
    if (!window.confirm(`Delete "${item.name}" from this plan? This is not permanent until you choose Save changes.`)) return;
    planner.updatePlan((current) => ({
      ...current,
      assets: current.assets
        .filter((candidate) => candidate.id !== item.id)
        .map((candidate, position) => ({ ...candidate, position })),
    }));
    if (editor?.draft.id === item.id) setEditor(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;
    const draft = editor.draft;
    const name = draft.name.trim();
    const property = isPropertyAsset(draft.type);
    if (!name) return setError('Enter a name for this asset.');
    if (!validMoney(draft.currentValue)) return setError('Enter a current value of zero or more.');
    if (!validOptionalYear(draft.startYear)) return setError('Enter a valid first year or leave it blank.');
    if (property) {
      if (draft.annualAppreciationPercent !== undefined && !validPercentage(draft.annualAppreciationPercent)) {
        return setError('Annual appreciation must be between -100% and 100%.');
      }
    } else {
      if (draft.expectedReturnPercent !== undefined && !validPercentage(draft.expectedReturnPercent)) {
        return setError('Expected return must be between -100% and 100%.');
      }
      if (draft.postRetirementReturnPercent !== undefined && !validPercentage(draft.postRetirementReturnPercent)) {
        return setError('Post-retirement return must be between -100% and 100%.');
      }
      if (draft.annualContribution !== undefined && !validMoney(draft.annualContribution)) {
        return setError('Annual contribution must be zero or more.');
      }
      if (!validOptionalYear(draft.contributionStartYear) || !validOptionalYear(draft.contributionEndYear)) {
        return setError('Enter valid contribution years or leave them blank.');
      }
      if (
        draft.contributionStartYear !== undefined
        && draft.contributionEndYear !== undefined
        && draft.contributionEndYear < draft.contributionStartYear
      ) {
        return setError('Contribution end year must be the same as or later than the start year.');
      }
    }

    const originalType = editor.mode === 'edit'
      ? plan.assets.find((candidate) => candidate.id === draft.id)?.type
      : undefined;
    const category = originalType === draft.type ? draft.category : undefined;
    const item: Asset = property ? {
      ...draft,
      name,
      category,
      currentValue: draft.currentValue,
      expectedReturnPercent: undefined,
      postRetirementReturnPercent: undefined,
      annualContribution: undefined,
      contributionFrequency: undefined,
      contributionStartYear: undefined,
      contributionEndYear: undefined,
    } : {
      ...draft,
      name,
      category,
      currentValue: draft.currentValue,
      annualAppreciationPercent: undefined,
    };
    planner.updatePlan((current) => ({
      ...current,
      assets: editor.mode === 'add'
        ? [...current.assets, item]
        : current.assets.map((candidate) => candidate.id === item.id ? item : candidate),
    }));
    setEditor(null);
    setError(undefined);
  };

  const updateDraft = (next: AssetDraft) => {
    setError(undefined);
    setEditor((current) => current ? { ...current, draft: next } : current);
  };
  const selectType = (value: string) => {
    if (!editor) return;
    const type = value as AssetType;
    const becomingProperty = isPropertyAsset(type);
    updateDraft({
      ...editor.draft,
      type,
      annualAppreciationPercent: becomingProperty
        ? (editor.draft.annualAppreciationPercent ?? plan.assumptions.generalInflationPercent)
        : editor.draft.annualAppreciationPercent,
      expectedReturnPercent: becomingProperty
        ? editor.draft.expectedReturnPercent
        : (editor.draft.expectedReturnPercent ?? plan.retirement.investmentReturnBeforeRetirementPercent),
    });
  };
  const property = editor ? isPropertyAsset(editor.draft.type) : false;

  return (
    <section className="collection-page assets-page" aria-labelledby="assets-page-title">
      <CollectionHeader
        headingId="assets-page-title"
        eyebrow="What you own"
        title="Assets"
        description="Track Canadian accounts, cash, investments, pensions, and property using assumptions you control."
        count={plan.assets.length}
        singular="asset"
        addLabel="Add asset"
        onAdd={openAdd}
      />
      <PrivacyNotice mode={planner.mode} />

      {editor && (
        <EditorPanel
          title={editor.mode === 'add' ? 'Add asset' : `Edit ${editor.draft.name}`}
          description="Registered account labels are for organization only; contribution limits and tax deductions are not calculated."
          submitLabel={editor.mode === 'add' ? 'Add to plan' : 'Update in plan'}
          error={error}
          onSubmit={submit}
          onCancel={() => { setEditor(null); setError(undefined); }}
        >
          <fieldset className="form-section">
            <legend>Asset details</legend>
            <div className="form-grid two">
              <TextField label="Asset name" value={editor.draft.name} maxLength={120} required onChange={(name) => updateDraft({ ...editor.draft, name })} />
              <SelectField label="Account or asset type" value={editor.draft.type} options={assetTypeOptions} onChange={selectType} />
              <MoneyField label={property ? 'Current property value' : 'Current balance or value'} required min={0} max={1_000_000_000_000} step="0.01" value={editor.draft.currentValue} onChange={(currentValue) => updateDraft({ ...editor.draft, currentValue })} />
              <NumberField label="First year included (optional)" min={1900} max={2200} step={1} value={editor.draft.startYear} onChange={(startYear) => updateDraft({ ...editor.draft, startYear })} hint="Defaults to the plan base year if blank." />
            </div>
          </fieldset>

          {property ? (
            <fieldset className="form-section">
              <legend>Property projection</legend>
              <div className="form-grid two">
                <PercentField label="Annual appreciation" min={-100} max={100} step="0.1" value={editor.draft.annualAppreciationPercent} onChange={(annualAppreciationPercent) => updateDraft({ ...editor.draft, annualAppreciationPercent })} hint="Your assumption, not a forecast. Use 0 for no change." />
              </div>
            </fieldset>
          ) : (
            <fieldset className="form-section">
              <legend>Growth and contributions</legend>
              <div className="form-grid three">
                <PercentField label="Expected annual return (optional)" min={-100} max={100} step="0.1" value={editor.draft.expectedReturnPercent} onChange={(expectedReturnPercent) => updateDraft({ ...editor.draft, expectedReturnPercent })} hint="Before retirement. Blank uses the plan default for investment assets." />
                <PercentField label="Return after retirement (optional)" min={-100} max={100} step="0.1" value={editor.draft.postRetirementReturnPercent} onChange={(postRetirementReturnPercent) => updateDraft({ ...editor.draft, postRetirementReturnPercent })} hint="Blank uses the retirement assumption where applicable." />
                <MoneyField label="Annual contribution (optional)" min={0} max={1_000_000_000_000} step="0.01" value={editor.draft.annualContribution} onChange={(annualContribution) => updateDraft({ ...editor.draft, annualContribution })} hint="Enter the full-year total, not each deposit." />
                <SelectField label="Contribution frequency" value={editor.draft.contributionFrequency ?? 'monthly'} options={recurringFrequencyOptions} onChange={(value) => updateDraft({ ...editor.draft, contributionFrequency: value as RecurringFrequency })} hint="Controls how the annual total is spread through the year." />
                <NumberField label="Contribution start year (optional)" min={1900} max={2200} step={1} value={editor.draft.contributionStartYear} onChange={(contributionStartYear) => updateDraft({ ...editor.draft, contributionStartYear })} />
                <NumberField label="Contribution end year (optional)" min={1900} max={2200} step={1} value={editor.draft.contributionEndYear} onChange={(contributionEndYear) => updateDraft({ ...editor.draft, contributionEndYear })} />
              </div>
            </fieldset>
          )}

          <fieldset className="form-section toggle-section">
            <legend>Projection treatment</legend>
            <ToggleField label="Include in projections" checked={editor.draft.enabled !== false} onChange={(enabled) => updateDraft({ ...editor.draft, enabled })} hint="Turn this off to keep the item without counting it." />
          </fieldset>
        </EditorPanel>
      )}

      <CollectionGuidance kind="assets" />

      <aside className="notice notice-caution">
        <strong>Canadian account rules are not applied.</strong>
        <span>TFSA, RRSP, FHSA, RESP, and RRIF labels do not enforce contribution room, deductions, withdrawals, grants, or tax treatment.</span>
      </aside>

      {plan.assets.length === 0 ? (
        <EmptyState title="No assets yet" body="Add a chequing account, TFSA, RRSP, FHSA, investment, pension, or property." actionLabel="Add your first asset" onAction={openAdd} />
      ) : (
        <section className="collection-list-section" aria-labelledby="assets-list-title">
          <h2 id="assets-list-title">Assets in this plan</h2>
          <ul className="collection-list">
            {plan.assets.map((item) => (
              <li key={item.id}>
                <EntityCard
                  name={item.name}
                  typeLabel={assetTypeLabels[item.type]}
                  enabled={item.enabled !== false}
                  metrics={[
                    { label: 'Current value', value: formatMoney(item.currentValue) },
                    {
                      label: isPropertyAsset(item.type) ? 'Appreciation' : 'Expected return',
                      value: `${formatPercent(isPropertyAsset(item.type) ? item.annualAppreciationPercent : item.expectedReturnPercent)} yearly`,
                    },
                    { label: 'Annual contribution', value: isPropertyAsset(item.type) ? 'Not applicable' : formatMoney(item.annualContribution ?? 0) },
                  ]}
                  editLabel={`Edit asset ${item.name}`}
                  deleteLabel={`Delete asset ${item.name}`}
                  onEdit={() => openEdit(item)}
                  onDelete={() => remove(item)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

export function DebtsPage() {
  const planner = usePlanner();
  const plan = planner.snapshot?.plan;
  const [editor, setEditor] = useState<EditorState<DebtDraft> | null>(null);
  const [error, setError] = useState<string>();

  if (!plan) return <MissingPlan section="debt plan" />;

  const openAdd = () => {
    if (!canReplaceEditor(editor !== null)) return;
    setError(undefined);
    setEditor({
      mode: 'add',
      draft: {
        id: createEntityId('debt'),
        planId: plan.id,
        position: plan.debts.length,
        name: '',
        enabled: true,
        type: 'mortgage',
        balance: undefined,
        annualInterestPercent: undefined,
        paymentAmount: undefined,
        paymentFrequency: 'monthly',
        remainingAmortizationMonths: 300,
        extraPaymentAmount: 0,
        compoundingPeriodsPerYear: 2,
        startYear: plan.baseYear,
      },
    });
  };

  const openEdit = (item: Debt) => {
    if (!canReplaceEditor(editor !== null)) return;
    setError(undefined);
    setEditor({ mode: 'edit', draft: { ...item } });
  };

  const remove = (item: Debt) => {
    if (!window.confirm(`Delete "${item.name}" from this plan? This is not permanent until you choose Save changes.`)) return;
    planner.updatePlan((current) => ({
      ...current,
      debts: current.debts
        .filter((candidate) => candidate.id !== item.id)
        .map((candidate, position) => ({ ...candidate, position })),
    }));
    if (editor?.draft.id === item.id) setEditor(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;
    const draft = editor.draft;
    const name = draft.name.trim();
    if (!name) return setError('Enter a name for this debt.');
    if (!validMoney(draft.balance)) return setError('Enter a balance of zero or more.');
    if (!validPercentage(draft.annualInterestPercent, false)) return setError('Interest rate must be between 0% and 100%.');
    if (!validMoney(draft.paymentAmount)) return setError('Enter a regular payment of zero or more.');
    if (
      !isFiniteNumber(draft.remainingAmortizationMonths)
      || !Number.isInteger(draft.remainingAmortizationMonths)
      || draft.remainingAmortizationMonths < 0
      || draft.remainingAmortizationMonths > 1_200
    ) {
      return setError('Remaining amortization must be a whole number from 0 to 1,200 months.');
    }
    if (draft.extraPaymentAmount !== undefined && !validMoney(draft.extraPaymentAmount)) {
      return setError('Extra payment must be zero or more.');
    }
    if (
      draft.compoundingPeriodsPerYear !== undefined
      && (!Number.isInteger(draft.compoundingPeriodsPerYear)
        || draft.compoundingPeriodsPerYear < 1
        || draft.compoundingPeriodsPerYear > 365)
    ) {
      return setError('Compounding periods must be a whole number from 1 to 365.');
    }
    if (!validOptionalYear(draft.startYear)) return setError('Enter a valid first year or leave it blank.');

    const item: Debt = {
      ...draft,
      name,
      balance: draft.balance,
      annualInterestPercent: draft.annualInterestPercent,
      paymentAmount: draft.paymentAmount,
      remainingAmortizationMonths: draft.remainingAmortizationMonths,
    };
    planner.updatePlan((current) => ({
      ...current,
      debts: editor.mode === 'add'
        ? [...current.debts, item]
        : current.debts.map((candidate) => candidate.id === item.id ? item : candidate),
    }));
    setEditor(null);
    setError(undefined);
  };

  const updateDraft = (next: DebtDraft) => {
    setError(undefined);
    setEditor((current) => current ? { ...current, draft: next } : current);
  };
  const selectType = (value: string) => {
    if (!editor) return;
    const type = value as DebtType;
    const usedMortgageDefault = editor.draft.type === 'mortgage'
      && editor.draft.compoundingPeriodsPerYear === 2;
    updateDraft({
      ...editor.draft,
      type,
      compoundingPeriodsPerYear: type === 'mortgage'
        ? (editor.draft.compoundingPeriodsPerYear ?? 2)
        : (usedMortgageDefault ? undefined : editor.draft.compoundingPeriodsPerYear),
    });
  };

  return (
    <section className="collection-page debts-page" aria-labelledby="debts-page-title">
      <CollectionHeader
        headingId="debts-page-title"
        eyebrow="What you owe"
        title="Debts"
        description="Add Canadian mortgages, lines of credit, cards, and loans so balances can amortize in the projection."
        count={plan.debts.length}
        singular="debt"
        addLabel="Add debt"
        onAdd={openAdd}
      />
      <PrivacyNotice mode={planner.mode} />

      {editor && (
        <EditorPanel
          title={editor.mode === 'add' ? 'Add debt' : `Edit ${editor.draft.name}`}
          description="Use the contractual payment amount for each selected period. Extra payment is additional principal per regular payment."
          submitLabel={editor.mode === 'add' ? 'Add to plan' : 'Update in plan'}
          error={error}
          onSubmit={submit}
          onCancel={() => { setEditor(null); setError(undefined); }}
        >
          <fieldset className="form-section">
            <legend>Debt details</legend>
            <div className="form-grid two">
              <TextField label="Debt name" value={editor.draft.name} maxLength={120} required onChange={(name) => updateDraft({ ...editor.draft, name })} />
              <SelectField label="Debt type" value={editor.draft.type} options={debtTypeOptions} onChange={selectType} />
              <MoneyField label="Current balance" required min={0} max={1_000_000_000_000} step="0.01" value={editor.draft.balance} onChange={(balance) => updateDraft({ ...editor.draft, balance })} />
              <PercentField label="Annual interest rate" required min={0} max={100} step="0.01" value={editor.draft.annualInterestPercent} onChange={(annualInterestPercent) => updateDraft({ ...editor.draft, annualInterestPercent })} />
              <MoneyField label="Regular payment" required min={0} max={1_000_000_000_000} step="0.01" value={editor.draft.paymentAmount} onChange={(paymentAmount) => updateDraft({ ...editor.draft, paymentAmount })} hint="Amount per payment period. Enter 0 to calculate a level payment from the remaining amortization." />
              <SelectField label="Payment frequency" value={editor.draft.paymentFrequency} options={recurringFrequencyOptions} onChange={(value) => updateDraft({ ...editor.draft, paymentFrequency: value as RecurringFrequency })} />
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Amortization</legend>
            <div className="form-grid three">
              <NumberField label="Remaining amortization (months)" required min={0} max={1_200} step={1} value={editor.draft.remainingAmortizationMonths} onChange={(remainingAmortizationMonths) => updateDraft({ ...editor.draft, remainingAmortizationMonths })} hint="For example, 25 years is 300 months. Enter 0 when the full balance is due in the first projected year; an insufficient regular payment produces a final balloon payoff." />
              <MoneyField label="Extra payment per payment (optional)" min={0} max={1_000_000_000_000} step="0.01" value={editor.draft.extraPaymentAmount} onChange={(extraPaymentAmount) => updateDraft({ ...editor.draft, extraPaymentAmount })} />
              <NumberField label="Compounding periods per year (optional)" min={1} max={365} step={1} value={editor.draft.compoundingPeriodsPerYear} onChange={(compoundingPeriodsPerYear) => updateDraft({ ...editor.draft, compoundingPeriodsPerYear })} hint={editor.draft.type === 'mortgage' ? 'Defaults to 2 for a mortgage. Confirm the convention in your agreement.' : 'Leave blank to use the payment frequency.'} />
              <NumberField label="First year included (optional)" min={1900} max={2200} step={1} value={editor.draft.startYear} onChange={(startYear) => updateDraft({ ...editor.draft, startYear })} hint="Defaults to the plan base year if blank." />
            </div>
          </fieldset>

          <fieldset className="form-section toggle-section">
            <legend>Projection treatment</legend>
            <ToggleField label="Include in projections" checked={editor.draft.enabled !== false} onChange={(enabled) => updateDraft({ ...editor.draft, enabled })} hint="Turn this off to keep the debt without counting it." />
          </fieldset>
        </EditorPanel>
      )}

      <CollectionGuidance kind="debts" />

      <aside className="notice notice-caution">
        <strong>Check your loan agreement.</strong>
        <span>Payment timing and compounding conventions affect amortization. This planner is an estimate and does not replace a lender statement.</span>
      </aside>

      {plan.debts.length === 0 ? (
        <EmptyState title="No debts yet" body="Add a mortgage, HELOC, line of credit, card, or loan to model repayment." actionLabel="Add your first debt" onAction={openAdd} />
      ) : (
        <section className="collection-list-section" aria-labelledby="debts-list-title">
          <h2 id="debts-list-title">Debts in this plan</h2>
          <ul className="collection-list">
            {plan.debts.map((item) => (
              <li key={item.id}>
                <EntityCard
                  name={item.name}
                  typeLabel={debtTypeLabels[item.type]}
                  enabled={item.enabled !== false}
                  metrics={[
                    { label: 'Balance', value: formatMoney(item.balance) },
                    { label: 'Interest', value: `${formatPercent(item.annualInterestPercent)} yearly` },
                    { label: 'Payment', value: `${formatMoney(item.paymentAmount)} ${frequencyLabels[item.paymentFrequency].toLowerCase()}` },
                  ]}
                  editLabel={`Edit debt ${item.name}`}
                  deleteLabel={`Delete debt ${item.name}`}
                  onEdit={() => openEdit(item)}
                  onDelete={() => remove(item)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
