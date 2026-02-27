// Settings Page — Accounts, Categories, Preferences, Sign Out
import { useEffect } from 'react';
import { useStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { ErrorBanner } from '../components/ErrorBanner';
import { formatAmountUnsigned } from '../api';
import { signOut } from '../auth';
import type { Account, Category } from '../types';

export function Settings() {
  const {
    accounts, accountsLoading, accountsError, fetchAccounts,
    categories, categoriesLoading, categoriesError, fetchCategories,
    settings, settingsLoading, fetchSettings, updateSettings,
  } = useStore();

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
    fetchSettings();
  }, []);

  return (
    <div className="screen">
      <div className="screen-name">Settings</div>

      {/* ACCOUNTS */}
      <div className="section-header" style={{ marginTop: 24 }}>ACCOUNTS</div>
      {accountsError && (
        <ErrorBanner message={accountsError} onRetry={() => fetchAccounts()} />
      )}
      {accountsLoading && accounts.length === 0 && !accountsError ? (
        <div className="spinner" />
      ) : (
        <GlassCard>
          <div style={{ padding: '4px 16px' }}>
            {accounts.map((acct, i) => (
              <AccountRow key={acct.id} account={acct} isLast={i === accounts.length - 1} />
            ))}
            {accounts.length === 0 && !accountsError && (
              <div className="empty-state" style={{ padding: '16px 0' }}>No linked accounts</div>
            )}
          </div>
        </GlassCard>
      )}

      {/* CATEGORIES */}
      <div className="section-header" style={{ marginTop: 24 }}>CATEGORIES</div>
      {categoriesError && (
        <ErrorBanner message={categoriesError} onRetry={() => fetchCategories()} />
      )}
      {categoriesLoading && categories.length === 0 && !categoriesError ? (
        <div className="spinner" />
      ) : (
        <GlassCard>
          <div style={{ padding: '4px 16px' }}>
            {categories.filter(c => !c.is_income).map((cat, i, arr) => (
              <CategoryRow key={cat.id} category={cat} isLast={i === arr.length - 1} />
            ))}
            {categories.filter(c => !c.is_income).length === 0 && !categoriesError && (
              <div className="empty-state" style={{ padding: '16px 0' }}>No categories</div>
            )}
          </div>
        </GlassCard>
      )}

      {/* PREFERENCES */}
      <div className="section-header" style={{ marginTop: 24 }}>PREFERENCES</div>
      {settingsLoading && !settings ? (
        <div className="spinner" />
      ) : (
        <GlassCard>
          <div style={{ padding: '4px 16px' }}>
            <PreferenceRow label="Budget Period" value={capitalize(settings?.budget_period ?? 'monthly')} />
            <PreferenceRow label="Currency" value={settings?.currency ?? 'CAD'} />
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 0',
            }}>
              <span className="body-text">Notifications</span>
              <div
                className={`toggle ${settings?.notifications_enabled ? 'toggle-on' : 'toggle-off'}`}
                onClick={() => settings && updateSettings({ notifications_enabled: !settings.notifications_enabled })}
              />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Bottom actions */}
      <div style={{ textAlign: 'center', marginTop: 32, paddingBottom: 20 }}>
        <button
          onClick={() => signOut()}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--warning)',
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            padding: '8px 16px',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function AccountRow({ account, isLast }: { account: Account; isLast: boolean }) {
  const isCredit = account.type === 'credit';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 0',
      borderBottom: isLast ? 'none' : '0.5px solid rgba(218,224,224,0.18)',
    }}>
      <div className="icon-box">
        {isCredit ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="#51697a" strokeWidth="1.5" />
            <path d="M2 10h20" stroke="#51697a" strokeWidth="1.5" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 21h18v-2H3v2zm0-4h18v-6H3v6zm0-8h18l-9-5-9 5z" fill="#51697a" />
          </svg>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {account.name} &middot;&middot;&middot;{account.mask}
        </div>
        <div className="data-small" style={{ color: 'var(--neutral)', marginTop: 2 }}>
          {isCredit && account.balance_limit ? (
            <>
              {formatAmountUnsigned(account.balance_current)} / {formatAmountUnsigned(account.balance_limit)}
            </>
          ) : (
            <>
              {formatAmountUnsigned(account.balance_available ?? account.balance_current)}
              {account.balance_available != null && <span className="sublabel"> available</span>}
            </>
          )}
        </div>
      </div>
      <span className="chevron">&#8250;</span>
    </div>
  );
}

function CategoryRow({ category, isLast }: { category: Category; isLast: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '14px 0',
      borderBottom: isLast ? 'none' : '0.5px solid rgba(218,224,224,0.18)',
    }}>
      <span style={{ width: 20, textAlign: 'center', fontSize: 14, color: 'var(--neutral)' }}>&#9776;</span>
      <div style={{ flex: 1, fontSize: 14 }}>{category.name}</div>
      <span className="chevron">&#8250;</span>
    </div>
  );
}

function PreferenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0',
      borderBottom: '0.5px solid rgba(218,224,224,0.18)',
    }}>
      <span className="body-text">{label}</span>
      <span style={{ color: 'var(--steel-blue)', fontSize: 14, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
