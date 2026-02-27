// Transactions Page — date-grouped feed with search, filter chips, category picker
import { useEffect, useState } from 'react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { useStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { MonthNavigator } from '../components/MonthNavigator';
import { SearchBar } from '../components/SearchBar';
import { ErrorBanner } from '../components/ErrorBanner';
import { formatAmountSigned } from '../api';
import type { Transaction, TransactionFilter, Category } from '../types';

export function Transactions() {
  const {
    transactions, transactionsLoading, transactionsError, transactionMonth,
    transactionFilter, transactionSearch, fetchTransactions, setTransactionFilter,
    setTransactionSearch, navigateMonth, categories, fetchCategories,
    updateTransactionCategory,
  } = useStore();

  const [pickerTxn, setPickerTxn] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const handleSearch = (val: string) => {
    setTransactionSearch(val);
    setTimeout(() => useStore.getState().fetchTransactions(), 0);
  };

  const grouped = groupByDate(transactions);

  return (
    <div className="screen">
      <div className="screen-name">Transactions</div>

      <MonthNavigator
        period={transactionMonth}
        onPrev={() => navigateMonth('prev')}
        onNext={() => navigateMonth('next')}
      />

      <SearchBar value={transactionSearch} onChange={handleSearch} />
      <FilterChips active={transactionFilter} onSelect={setTransactionFilter} />

      {transactionsError && (
        <ErrorBanner message={transactionsError} onRetry={() => fetchTransactions()} />
      )}

      {transactionsLoading && transactions.length === 0 && !transactionsError ? (
        <div className="spinner" />
      ) : grouped.length === 0 && !transactionsError ? (
        <div className="empty-state">No transactions this period</div>
      ) : (
        grouped.map(({ label, transactions: txns }) => (
          <div key={label}>
            <div className="section-header" style={{ marginTop: 20, marginBottom: 6 }}>{label}</div>
            <GlassCard style={{ marginBottom: 16 }}>
              <div style={{ padding: '4px 0' }}>
                {txns.map((txn, i) => (
                  <div key={txn.id}>
                    <TransactionRow txn={txn} onCategoryClick={() => setPickerTxn(txn)} />
                    {i < txns.length - 1 && <div className="row-divider" />}
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        ))
      )}

      {pickerTxn && (
        <CategoryPicker
          transaction={pickerTxn}
          categories={categories}
          onSelect={async (catId, applyToAll) => {
            await updateTransactionCategory(pickerTxn.id, catId, applyToAll);
            setPickerTxn(null);
          }}
          onClose={() => setPickerTxn(null)}
        />
      )}
    </div>
  );
}

function FilterChips({ active, onSelect }: { active: TransactionFilter; onSelect: (f: TransactionFilter) => void }) {
  const filters: TransactionFilter[] = ['all', 'income', 'pending'];
  const labels: Record<TransactionFilter, string> = { all: 'All', income: 'Income', pending: 'Pending' };
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => onSelect(f)}
          style={{
            padding: '5px 14px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            border: active === f ? 'none' : '1px solid rgba(218,224,224,0.3)',
            background: active === f ? 'var(--deep-sage)' : 'rgba(255,255,255,0.3)',
            color: active === f ? 'white' : 'var(--neutral)',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
        >
          {labels[f]}
        </button>
      ))}
    </div>
  );
}

function TransactionRow({ txn, onCategoryClick }: { txn: Transaction; onCategoryClick: () => void }) {
  const categories = useStore((s) => s.categories);
  const catName = categories.find((c) => c.id === txn.category_id)?.name ?? 'Uncategorized';
  const channelLabel = txn.payment_channel === 'in store' ? 'In Store'
    : txn.payment_channel === 'online' ? 'Online'
    : txn.payment_channel === 'other' ? 'Direct Deposit' : txn.payment_channel;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
      <div style={{ flex: 1, marginRight: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{txn.display_merchant || txn.name}</div>
        <div className="sublabel">
          <span onClick={onCategoryClick} style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}>
            {catName}
          </span>
          {' \u00B7 '}{channelLabel}
          {txn.pending && <span style={{ marginLeft: 4, color: 'var(--warning)' }}>(pending)</span>}
        </div>
      </div>
      <div
        className="data-text"
        style={{ fontSize: 15, color: txn.is_income ? 'var(--surplus)' : 'var(--deep-sage)' }}
      >
        {formatAmountSigned(txn.amount, txn.is_income)}
      </div>
    </div>
  );
}

function CategoryPicker({
  transaction,
  categories,
  onSelect,
  onClose,
}: {
  transaction: Transaction;
  categories: Category[];
  onSelect: (catId: string, applyToAll: boolean) => void;
  onClose: () => void;
}) {
  const [applyToAll, setApplyToAll] = useState(false);
  const nonIncome = categories.filter((c) => !c.is_income);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--bg-eggshell)',
          borderRadius: 16,
          padding: '24px',
          maxHeight: '70vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(42,63,82,0.2)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Recategorize</div>
          <div className="sublabel" style={{ fontSize: 12 }}>{transaction.display_merchant || transaction.name}</div>
        </div>
        {nonIncome.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id, applyToAll)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: '0.5px solid rgba(218,224,224,0.18)',
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'var(--font-body)',
              color: cat.id === transaction.category_id ? 'var(--steel-blue)' : 'var(--deep-sage)',
              fontWeight: cat.id === transaction.category_id ? 600 : 400,
            }}
          >
            {cat.name}
          </button>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 13, color: 'var(--neutral)' }}>
          <input type="checkbox" checked={applyToAll} onChange={(e) => setApplyToAll(e.target.checked)} />
          Apply to all from this merchant
        </label>
      </div>
    </div>
  );
}

interface DateGroup {
  label: string;
  transactions: Transaction[];
}

function groupByDate(txns: Transaction[]): DateGroup[] {
  const groups = new Map<string, Transaction[]>();
  for (const txn of txns) {
    const key = txn.date;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(txn);
  }

  const sorted = [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));

  return sorted.map(([dateStr, txns]) => {
    const date = parseISO(dateStr);
    let label: string;
    if (isToday(date)) {
      label = `TODAY \u00B7 ${format(date, 'MMM d').toUpperCase()}`;
    } else if (isYesterday(date)) {
      label = `YESTERDAY \u00B7 ${format(date, 'MMM d').toUpperCase()}`;
    } else {
      label = format(date, 'EEEE, MMMM d').toUpperCase();
    }
    return { label, transactions: txns };
  });
}
