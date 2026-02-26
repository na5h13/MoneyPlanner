// OpenSpec v1.0 Data Schemas — Section 21 (Budget Tracker) + Section 22 (Trending)
// All amounts stored as cents (integer) to avoid floating-point precision.

export interface Account {
  id: string;
  user_id: string;
  plaid_account_id: string;
  name: string;
  official_name: string | null;
  type: string;        // depository, credit, loan, investment
  subtype: string;     // checking, savings, credit card, etc.
  mask: string;        // last 4 digits
  balance_current: number;   // cents
  balance_available: number | null; // cents
  balance_limit: number | null;     // cents (credit)
  hidden: boolean;
  last_synced_at: string;    // ISO timestamp
}

export interface Transaction {
  id: string;
  plaid_transaction_id: string;
  user_id: string;
  account_id: string;
  amount: number;            // cents — positive = debit, negative = credit (Plaid convention)
  date: string;              // YYYY-MM-DD
  name: string;
  merchant_name: string | null;
  pending: boolean;
  payment_channel: string;   // online, in store, other
  plaid_category: string[];
  category_id: string | null;
  category_confidence: number; // 0.0 - 1.0
  is_recurring: boolean;
  is_income: boolean;
  display_merchant: string;
  synced_at: string;
  categorized_at: string | null;
  categorized_by: 'auto' | 'user' | null;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;        // SVG identifier
  sort_order: number;
  is_default: boolean;
  is_income: boolean;
  includes: string[];  // keywords for matching
  created_at: string;
  updated_at: string;
}

export interface CategoryRule {
  id: string;
  user_id: string;
  normalized_merchant: string;
  category_id: string;
  created_from_txn: string;  // transaction ID
  created_at: string;
  updated_at: string;
}

export interface BudgetTarget {
  id: string;
  user_id: string;
  category_id: string;
  period_type: 'monthly' | 'weekly' | 'biweekly';
  period_start: string;      // YYYY-MM
  target_amount: number;     // cents
  is_suggested: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetLineItem {
  id: string;
  user_id: string;
  category_id: string;
  display_name: string;
  linked_merchant: string | null;
  budget_amount: number;     // cents
  source: 'auto' | 'user';
  is_active: boolean;
  renamed_by_user: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Display-only — joined from spending_classifications (M8)
  classification_type?: ClassificationType;
}

export interface UserSettings {
  user_id: string;
  budget_period: 'monthly' | 'weekly' | 'biweekly';
  currency: string;
  notifications_enabled: boolean;
  plaid_access_token: string | null;   // encrypted
  plaid_item_id: string | null;
  created_at: string;
  updated_at: string;
}

// Trending Classification (Section 22 — M8)
export type ClassificationType = 'FIXED' | 'RECURRING_VARIABLE' | 'TRUE_VARIABLE' | 'UNCLASSIFIED';
export type ClassificationSource = 'AUTO_DETECTED' | 'USER_OVERRIDE';

// Per-line-item classification for budget display
export interface LineItemClassification {
  type: ClassificationType;
  source: ClassificationSource;
}

export interface SpendingClassification {
  id: string;
  user_id: string;
  merchant_normalized: string;
  category_id: string;
  classification_type: ClassificationType;
  source: ClassificationSource;
  confidence: number;
  expected_amount: number | null;       // cents (FIXED)
  expected_day: number | null;          // day of month (FIXED)
  amount_range_low: number | null;      // cents (RECURRING_VARIABLE)
  amount_range_high: number | null;     // cents (RECURRING_VARIABLE)
  reclassification_flag: boolean;
  last_evaluated: string;
  created_at: string;
  updated_at: string;
}

// Trending status for budget display
export type TrendingStatus = 'ON_TRACK' | 'WATCH' | 'OVER' | 'INSUFFICIENT_DATA' | 'NO_TARGET';

export interface TrendingData {
  category_id: string;
  spent_so_far: number;       // cents
  projected: number;          // cents
  target: number;             // cents
  status: TrendingStatus;
  days_elapsed: number;
  days_in_period: number;
}

// Budget display composite
export interface BudgetCategoryDisplay {
  category: Category;
  target: BudgetTarget | null;
  line_items: BudgetLineItem[];
  spent: number;              // cents
  trending: TrendingData | null;
  is_collapsed: boolean;
}

// Transaction filter state
export type TransactionFilter = 'all' | 'income' | 'pending';

// API response wrappers
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

// Budget summary (M6 — Summary Bar)
export interface BudgetSummary {
  income: number;       // cents — total income this period
  committed: number;    // cents — total non-income spending
  one_time: number;     // cents — non-recurring expenses > $200 threshold
  safe_to_spend: number; // cents — income - committed
}

// Budget period for navigation
export interface BudgetPeriod {
  year: number;
  month: number;   // 1-12
  label: string;   // "January 2026"
}

// Sync status
export interface SyncStatus {
  last_synced_at: string | null;
  is_syncing: boolean;
  error: string | null;
}
