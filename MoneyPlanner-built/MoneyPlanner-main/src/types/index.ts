// src/types/index.ts
// Core types for MoneyPlanner

// ============================================================
// USER
// ============================================================

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  onboardingComplete: boolean;
  settings: UserSettings;
}

export interface UserSettings {
  currency: string; // ISO 4217 (e.g., 'CAD', 'USD')
  notificationsEnabled: boolean;
  automationLevel: 'full' | 'suggest' | 'manual'; // How much IIN automates
  incomeCheckFrequency: 'weekly' | 'biweekly' | 'monthly';
}

// ============================================================
// BUDGET
// ============================================================

export interface Budget {
  id: string;
  userId: string;
  name: string;
  period: BudgetPeriod;
  categories: BudgetCategory[];
  totalIncome: number;
  totalAllocated: number;
  createdAt: string;
  updatedAt: string;
}

export type BudgetPeriod = 'weekly' | 'biweekly' | 'monthly';

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  allocated: number; // Amount allocated to this category
  spent: number; // Amount spent (from Plaid transactions)
  type: CategoryType;
  isAutomated: boolean; // Whether IIN manages this allocation
}

export type CategoryType = 'need' | 'want' | 'savings' | 'investment';

// ============================================================
// IIN (Income Increase Neutralization)
// ============================================================

export interface IINConfig {
  id: string;
  userId: string;
  enabled: boolean;
  baselineIncome: number; // Income when IIN was set up
  currentIncome: number; // Latest detected income
  rules: IINRule[];
  history: IINEvent[];
}

export interface IINRule {
  id: string;
  name: string;
  percentage: number; // % of income increase to redirect
  targetType: 'savings' | 'investment' | 'debt' | 'category';
  targetId: string; // ID of the target account/category
  priority: number; // Order of execution (1 = first)
  isActive: boolean;
}

export interface IINEvent {
  id: string;
  timestamp: string;
  previousIncome: number;
  newIncome: number;
  increaseAmount: number;
  allocations: IINAllocation[];
  status: 'applied' | 'pending_review' | 'dismissed';
}

export interface IINAllocation {
  ruleId: string;
  ruleName: string;
  amount: number;
  targetType: string;
  targetId: string;
}

// ============================================================
// PLAID / BANKING
// ============================================================

export interface ConnectedAccount {
  id: string;
  userId: string;
  institutionId: string;
  institutionName: string;
  institutionLogo: string | null;
  accountName: string;
  accountType: string;
  accountSubtype: string;
  mask: string; // Last 4 digits
  currentBalance: number | null;
  availableBalance: number | null;
  lastSynced: string;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  date: string;
  name: string;
  merchantName: string | null;
  category: string[];
  pending: boolean;
  budgetCategoryId: string | null; // Linked to a BudgetCategory
}

export interface IncomeStream {
  name: string;
  amount: number;
  frequency: string;
  lastDetected: string;
  confidence: number; // 0-1
}

// ============================================================
// NAVIGATION
// ============================================================

export type RootStackParamList = {
  '(auth)/login': undefined;
  '(auth)/onboarding': undefined;
  '(tabs)': undefined;
  '(modals)/connect-bank': undefined;
  '(modals)/iin-setup': undefined;
  '(modals)/iin-review': { eventId: string };
};
