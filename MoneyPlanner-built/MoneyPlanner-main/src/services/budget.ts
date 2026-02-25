// src/services/budget.ts
// Budget service — fetches budget summaries and safe-to-spend from Flask backend

import { api } from './api';

interface BudgetCategory {
  name: string;
  monthly_avg: number;
  total: number;
  count: number;
}

interface BudgetEnvelope {
  name: string;
  categories: BudgetCategory[];
  subtotal: number;
}

interface BudgetSummary {
  monthly_income: number;
  monthly_expense: number;
  monthly_balance: number;
  months_analyzed: number;
  envelopes: BudgetEnvelope[];
}

interface SafeToSpend {
  monthly_income: number;
  fixed_expenses: number;
  savings_target: number;
  discretionary_budget: number;
  month_spending: number;
  safe_to_spend: number;
  days_remaining: number;
}

interface PhaseInfo {
  phase: {
    current_phase: string;
    phase_entered_at: string;
  };
  unlocked_features: string[];
  transition: Record<string, unknown>;
}

export const budgetService = {
  /** Get budget summary with envelope breakdowns */
  async getSummary(): Promise<BudgetSummary> {
    const { data } = await api.get<BudgetSummary>('/api/budget/summary');
    return data;
  },

  /** Get safe-to-spend calculation */
  async getSafeToSpend(): Promise<SafeToSpend> {
    const { data } = await api.get<SafeToSpend>('/api/safe-to-spend');
    return data;
  },

  /** Get current app phase and unlocked features */
  async getPhase(): Promise<PhaseInfo> {
    const { data } = await api.get<PhaseInfo>('/api/phase');
    return data;
  },

  /** Attempt to advance to the next phase */
  async advancePhase(): Promise<{
    success: boolean;
    message: string;
    phase: Record<string, unknown> | null;
  }> {
    const { data } = await api.post<{
      success: boolean;
      message: string;
      phase: Record<string, unknown> | null;
    }>('/api/phase/advance');
    return data;
  },

  /** Get weekly review */
  async getWeeklyReview(): Promise<Record<string, unknown>> {
    const { data } = await api.get<Record<string, unknown>>(
      '/api/reviews/weekly'
    );
    return data;
  },
};
