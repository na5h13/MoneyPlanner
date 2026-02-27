// Budget Page — Hierarchical drill-down: GroupCard → CategoryCard → LineItems
// Groups start collapsed. Categories inside groups start collapsed.
// Tap group → see categories. Tap category → see line items.
import { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { MonthNavigator } from '../components/MonthNavigator';
import { ErrorBanner } from '../components/ErrorBanner';
import { formatAmountUnsigned, formatAmountSigned } from '../api';
import type { BudgetCategoryDisplay, BudgetLineItem, CategoryGroup } from '../types';

const GROUP_ORDER: CategoryGroup[] = ['Essentials', 'Daily Living', 'Family & Home', 'Leisure', 'Financial'];

interface GroupData {
  group: CategoryGroup;
  categories: BudgetCategoryDisplay[];
  totalSpent: number;
  totalTarget: number;
}

function groupBudgetData(budgetDisplay: BudgetCategoryDisplay[]): { groups: GroupData[]; uncategorized: BudgetCategoryDisplay | null } {
  const grouped = new Map<CategoryGroup, BudgetCategoryDisplay[]>();
  let uncategorized: BudgetCategoryDisplay | null = null;

  for (const cat of budgetDisplay) {
    if (cat.category.is_income) continue;

    const group = (cat.category as any).group as CategoryGroup | undefined;

    if (!group || group === 'Uncategorized') {
      if (cat.category.name === 'Uncategorized') uncategorized = cat;
      else {
        // Fallback for categories without group field
        const fallback: CategoryGroup = 'Daily Living';
        if (!grouped.has(fallback)) grouped.set(fallback, []);
        grouped.get(fallback)!.push(cat);
      }
      continue;
    }

    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push(cat);
  }

  const groups: GroupData[] = [];
  for (const groupName of GROUP_ORDER) {
    const cats = grouped.get(groupName) || [];
    if (cats.length === 0) continue;
    groups.push({
      group: groupName,
      categories: cats,
      totalSpent: cats.reduce((sum, c) => sum + c.spent, 0),
      totalTarget: cats.reduce((sum, c) => sum + (c.target?.target_amount ?? 0), 0),
    });
  }

  return { groups, uncategorized };
}

export function Budget() {
  const {
    budgetDisplay, budgetSummary, budgetLoading, budgetError, budgetPeriod,
    collapsedGroups, expandedCategories,
    fetchBudget, navigateBudgetPeriod,
    toggleGroupCollapse, toggleCategoryExpand, createLineItem,
  } = useStore();

  // Fetch budget for the current period on mount
  useEffect(() => { fetchBudget(budgetPeriod); }, []);

  const { groups, uncategorized } = useMemo(
    () => groupBudgetData(budgetDisplay),
    [budgetDisplay],
  );

  return (
    <div className="screen">
      <div className="screen-name">Monthly Budget</div>

      <MonthNavigator
        period={budgetPeriod}
        onPrev={() => navigateBudgetPeriod('prev')}
        onNext={() => navigateBudgetPeriod('next')}
      />

      {budgetError && (
        <ErrorBanner message={budgetError} onRetry={() => fetchBudget(budgetPeriod)} />
      )}

      {budgetLoading && budgetDisplay.length === 0 && !budgetError ? (
        <div className="spinner" />
      ) : (
        <>
          {budgetSummary && <SummaryBar summary={budgetSummary} />}

          {groups.map((g) => (
            <GroupCard
              key={g.group}
              data={g}
              collapsed={collapsedGroups.has(g.group)}
              expandedCategories={expandedCategories}
              onToggleGroup={() => toggleGroupCollapse(g.group)}
              onToggleCategory={(id) => toggleCategoryExpand(id)}
              onAddItem={(catId, name) => createLineItem(catId, name)}
            />
          ))}

          {uncategorized && uncategorized.spent > 0 && (
            <CategoryCard
              display={uncategorized}
              collapsed={!expandedCategories.has(uncategorized.category.id)}
              onToggle={() => toggleCategoryExpand(uncategorized!.category.id)}
              onAddItem={(name) => createLineItem(uncategorized!.category.id, name)}
            />
          )}

          {groups.length === 0 && !budgetLoading && !budgetError && (
            <div className="empty-state">No budget data for this period</div>
          )}
        </>
      )}
    </div>
  );
}

/* ── SummaryBar ── */

function SummaryBar({ summary }: { summary: { income: number; committed: number; one_time: number; safe_to_spend: number } }) {
  const isPositive = summary.safe_to_spend >= 0;
  return (
    <GlassCard tier="strong" glow={isPositive ? 'surplus' : 'warning'} style={{ textAlign: 'center', padding: '20px 24px' }}>
      <div className="section-header" style={{ marginBottom: 4 }}>SAFE TO SPEND</div>
      <div className="hero-text" style={{ color: isPositive ? 'var(--surplus)' : 'var(--warning)' }}>
        {formatAmountSigned(Math.abs(summary.safe_to_spend), isPositive)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16, alignItems: 'center' }}>
        <SummaryItem label="INCOME" value={summary.income} color="var(--surplus)" />
        <div style={{ width: 1, height: 28, background: 'var(--soft-taupe)' }} />
        <SummaryItem label="COMMITTED" value={summary.committed} color="var(--deep-sage)" />
        <div style={{ width: 1, height: 28, background: 'var(--soft-taupe)' }} />
        <SummaryItem label="ONE-TIME" value={summary.one_time} color="var(--warning)" />
      </div>
    </GlassCard>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' as const, marginBottom: 3, color: 'var(--neutral)' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-data)', fontSize: 15, fontWeight: 600, color }}>
        {formatAmountUnsigned(value)}
      </div>
    </div>
  );
}

/* ── GroupCard ── */

function GroupCard({
  data,
  collapsed,
  expandedCategories,
  onToggleGroup,
  onToggleCategory,
  onAddItem,
}: {
  data: GroupData;
  collapsed: boolean;
  expandedCategories: Set<string>;
  onToggleGroup: () => void;
  onToggleCategory: (id: string) => void;
  onAddItem: (categoryId: string, name: string) => void;
}) {
  const { group, categories, totalSpent, totalTarget } = data;
  const isOver = totalTarget > 0 && totalSpent > totalTarget;
  const pct = totalTarget > 0 ? Math.min((totalSpent / totalTarget) * 100, 100) : 0;
  const hasTarget = totalTarget > 0;

  return (
    <GlassCard glow={isOver ? 'warning' : undefined} style={{ padding: '14px 16px' }}>
      {/* Group header */}
      <div
        onClick={onToggleGroup}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11,
            color: 'var(--neutral)',
            transition: 'transform 0.2s',
            display: 'inline-block',
            transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
          }}>
            {'\u25B8'}
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{group}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="data-text" style={{ fontSize: 14, color: isOver ? 'var(--warning)' : undefined }}>
            {formatAmountUnsigned(totalSpent)}
          </span>
          {hasTarget && (
            <span className="data-text" style={{ fontSize: 12, color: 'var(--neutral)' }}>
              /{formatAmountUnsigned(totalTarget)}
            </span>
          )}
          {isOver && <span style={{ fontSize: 10, color: 'var(--warning)', marginLeft: 2 }}>&#9650;</span>}
        </div>
      </div>

      {/* Progress bar — always visible as track, filled if targets exist */}
      <div className="progress-container">
        <div className="progress-bg">
          {hasTarget && (
            <div
              className="progress-fill"
              style={{
                width: `${pct}%`,
                background: isOver ? 'var(--warning)' : 'var(--deep-sage)',
              }}
            />
          )}
        </div>
      </div>

      {/* Expanded: show category cards */}
      {!collapsed && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {categories.map((cat) => (
            <CategoryCard
              key={cat.category.id}
              display={cat}
              collapsed={!expandedCategories.has(cat.category.id)}
              onToggle={() => onToggleCategory(cat.category.id)}
              onAddItem={(name) => onAddItem(cat.category.id, name)}
              nested
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}

/* ── CategoryCard ── */

function CategoryCard({
  display,
  collapsed,
  onToggle,
  onAddItem,
  nested = false,
}: {
  display: BudgetCategoryDisplay;
  collapsed: boolean;
  onToggle: () => void;
  onAddItem: (name: string) => void;
  nested?: boolean;
}) {
  const { category, target, line_items, spent } = display;
  const targetAmount = target?.target_amount ?? 0;
  const isOver = targetAmount > 0 && spent > targetAmount;
  const pct = targetAmount > 0 ? Math.min((spent / targetAmount) * 100, 100) : 0;
  const hasTarget = targetAmount > 0;

  const card = (
    <>
      {/* Header */}
      <div
        onClick={onToggle}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 10,
            color: 'var(--neutral)',
            transition: 'transform 0.2s',
            display: 'inline-block',
            transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
          }}>
            {'\u25B8'}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{category.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="data-text" style={{ fontSize: 13, color: isOver ? 'var(--warning)' : undefined }}>
            {formatAmountUnsigned(spent)}
          </span>
          {hasTarget && (
            <span className="data-text" style={{ fontSize: 11, color: 'var(--neutral)' }}>
              /{formatAmountUnsigned(targetAmount)}
            </span>
          )}
          {isOver && <span style={{ fontSize: 10, color: 'var(--warning)', marginLeft: 2 }}>&#9650;</span>}
        </div>
      </div>

      {/* Progress bar — always visible as track */}
      <div style={{ marginTop: 4 }}>
        <div className="progress-bg" style={{ height: 3 }}>
          {hasTarget && (
            <div
              className="progress-fill"
              style={{
                width: `${pct}%`,
                height: 3,
                background: isOver ? 'var(--warning)' : 'var(--deep-sage)',
              }}
            />
          )}
        </div>
      </div>

      {/* Line items — only when expanded */}
      {!collapsed && line_items.length > 0 && (
        <>
          <ColumnHeaders />
          {line_items.map((item) => (
            <LineItemRow key={item.id} item={item} />
          ))}
          <AddItemButton onAdd={onAddItem} />
        </>
      )}

      {!collapsed && line_items.length === 0 && (
        <AddItemButton onAdd={onAddItem} />
      )}
    </>
  );

  if (nested) {
    return (
      <GlassCard tier="inset" glow={isOver ? 'warning' : undefined} style={{ padding: '10px 12px' }}>
        {card}
      </GlassCard>
    );
  }

  return (
    <GlassCard glow={isOver ? 'warning' : undefined} style={{ padding: '14px 16px' }}>
      {card}
    </GlassCard>
  );
}

/* ── Line Item Components ── */

function ColumnHeaders() {
  const headerStyle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: 'var(--neutral)',
  };
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '6px 0',
      borderBottom: '0.5px solid rgba(218,224,224,0.18)',
      marginBottom: 4,
      marginTop: 14,
    }}>
      <div style={{ width: 28 }} />
      <div style={{ flex: 1, ...headerStyle }}>ITEM</div>
      <div style={{ width: 80, textAlign: 'right', ...headerStyle }}>BUDGET</div>
      <div style={{ width: 90, textAlign: 'right', ...headerStyle }}>TRENDING</div>
      <div style={{ width: 20 }} />
    </div>
  );
}

function LineItemRow({ item }: { item: BudgetLineItem }) {
  const trending = item.item_trending;
  const badgeLabel = classificationBadge(item.classification_type);
  const trendingText = formatTrending(trending);
  const isWarning = trending?.status === 'over' || trending?.status === 'watch';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '7px 0',
      borderBottom: '0.5px solid rgba(218,224,224,0.10)',
    }}>
      {badgeLabel ? (
        <span className="class-badge">{badgeLabel}</span>
      ) : (
        <span className="class-badge-spacer" />
      )}
      <div style={{ flex: 1, fontSize: 13 }}>{item.display_name}</div>
      <div style={{ width: 80, textAlign: 'right' }} className="data-small">
        {formatAmountUnsigned(item.budget_amount)}
      </div>
      <div
        style={{
          width: 90,
          textAlign: 'right',
          color: isWarning ? 'var(--warning)' : undefined,
          fontWeight: isWarning && trending?.status === 'over' ? 700 : undefined,
        }}
        className="data-small"
      >
        {trendingText}
      </div>
      <div style={{ width: 20, textAlign: 'center', fontSize: 11 }}>
        {trending?.status === 'over' && <span style={{ color: 'var(--warning)' }}>&#9650;</span>}
        {trending?.status === 'watch' && <span style={{ color: 'var(--warning)' }}>&#9888;</span>}
      </div>
    </div>
  );
}

function AddItemButton({ onAdd }: { onAdd: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
      setAdding(false);
    }
  };

  if (adding) {
    return (
      <div style={{ display: 'flex', gap: 8, padding: '8px 0', alignItems: 'center' }}>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') { setAdding(false); setName(''); }
          }}
          placeholder="Item name"
          style={{
            flex: 1,
            border: '1px solid rgba(218,224,224,0.3)',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 13,
            fontFamily: 'var(--font-body)',
            outline: 'none',
            background: 'rgba(255,255,255,0.3)',
          }}
        />
        <button
          onClick={handleSubmit}
          style={{ background: 'none', border: 'none', color: 'var(--steel-blue)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Add
        </button>
        <button
          onClick={() => { setAdding(false); setName(''); }}
          style={{ background: 'none', border: 'none', color: 'var(--neutral)', fontSize: 13, cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => setAdding(true)}
      style={{ textAlign: 'center', padding: '8px 0', color: 'var(--steel-blue)', fontSize: 12, cursor: 'pointer' }}
    >
      + Add item
    </div>
  );
}

/* ── Helpers ── */

function classificationBadge(type?: string): string | null {
  switch (type) {
    case 'FIXED': return 'FX';
    case 'RECURRING_VARIABLE': return 'RV';
    case 'TRUE_VARIABLE': return 'TV';
    default: return null;
  }
}

function formatTrending(trending?: { posted: boolean; amount: number; status: string } | null): string {
  if (!trending) return '';
  const amt = formatAmountUnsigned(trending.amount);
  if (trending.posted && trending.status === 'ok') return `\u2713${amt}`;
  if (trending.posted) return amt;
  return `~${amt}`;
}
