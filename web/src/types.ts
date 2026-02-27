// Shared TypeScript interfaces — copied from mobile src/types/index.ts
// All amounts stored as cents (integer) to avoid floating-point precision.

export interface Account {
  id: string;
  user_id: string;
  plaid_account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string;
  mask: string;
  balance_current: number;
  balance_available: number | null;
  balance_limit: number | null;
  hidden: boolean;
  last_synced_at: string;
}

export interface Transaction {
  id: string;
  plaid_transaction_id: string;
  user_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name: string | null;
  pending: boolean;
  payment_channel: string;
  plaid_category: string[];
  category_id: string | null;
  category_confidence: number;
  is_recurring: boolean;
  is_income: boolean;
  display_merchant: string;
  synced_at: string;
  categorized_at: string | null;
  categorized_by: 'auto' | 'user' | null;
}

export type CategoryGroup = 'Income' | 'Essentials' | 'Daily Living' | 'Family & Home' | 'Leisure' | 'Financial' | 'Uncategorized';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  group: CategoryGroup;
  sort_order: number;
  is_default: boolean;
  is_income: boolean;
  includes: string[];
  created_at: string;
  updated_at: string;
}

export interface BudgetTarget {
  id: string;
  user_id: string;
  category_id: string;
  period_type: 'monthly' | 'weekly' | 'biweekly';
  period_start: string;
  target_amount: number;
  is_suggested: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItemTrending {
  posted: boolean;
  amount: number;
  status: 'ok' | 'watch' | 'over';
}

export type ClassificationType = 'FIXED' | 'RECURRING_VARIABLE' | 'TRUE_VARIABLE' | 'UNCLASSIFIED';

export interface BudgetLineItem {
  id: string;
  user_id: string;
  category_id: string;
  display_name: string;
  linked_merchant: string | null;
  budget_amount: number;
  source: 'auto' | 'user';
  is_active: boolean;
  renamed_by_user: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  classification_type?: ClassificationType;
  item_trending?: ItemTrending;
}

export interface UserSettings {
  user_id: string;
  budget_period: 'monthly' | 'weekly' | 'biweekly';
  currency: string;
  notifications_enabled: boolean;
  plaid_access_token: string | null;
  plaid_item_id: string | null;
  created_at: string;
  updated_at: string;
}

export type TrendingStatus = 'ON_TRACK' | 'WATCH' | 'OVER' | 'INSUFFICIENT_DATA' | 'NO_TARGET';

export interface TrendingData {
  category_id: string;
  spent_so_far: number;
  projected: number;
  target: number;
  status: TrendingStatus;
  days_elapsed: number;
  days_in_period: number;
}

export interface BudgetCategoryDisplay {
  category: Category;
  target: BudgetTarget | null;
  line_items: BudgetLineItem[];
  spent: number;
  trending: TrendingData | null;
  is_collapsed: boolean;
}

export type TransactionFilter = 'all' | 'income' | 'pending';

export interface BudgetSummary {
  income: number;
  committed: number;
  one_time: number;
  safe_to_spend: number;
}

export interface BudgetPeriod {
  year: number;
  month: number;
  label: string;
}
