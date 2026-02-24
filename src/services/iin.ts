// src/services/iin.ts
// IIN (Income Increase Neutralization) service
// Talks to Flask backend for automation config and income tracking

import { api } from './api';

interface IINConfig {
  id: string;
  user_id: string;
  savings_rate_pct: number;
  destination: string;
  is_active: boolean;
  pending_escalation: {
    old_rate: number;
    new_rate: number;
    reason: string;
    status: string;
  } | null;
  history: Array<Record<string, unknown>>;
}

interface IncomeEvent {
  id: string;
  amount: number;
  date: string;
  source: string;
  source_description: string;
  is_recurring: boolean;
  rolling_3mo_average: number | null;
  income_change_flag: string | null;
}

interface IncomeResponse {
  status: string;
  income_event: IncomeEvent;
  rolling_3mo_average: number;
  income_change_flag: string | null;
  phase_advanced: boolean;
  escalation_proposed: boolean;
  rate_reduced: boolean;
}

export const iinService = {
  /** Get IIN automation config */
  async getConfig(): Promise<IINConfig | null> {
    const { data } = await api.get<{ config: IINConfig | null }>(
      '/api/iin/config'
    );
    return data.config;
  },

  /** Create or update IIN config */
  async updateConfig(config: {
    savings_rate_pct: number;
    destination?: string;
    is_active?: boolean;
  }): Promise<IINConfig> {
    const { data } = await api.put<{ config: IINConfig }>(
      '/api/iin/config',
      config as Record<string, unknown>
    );
    return data.config;
  },

  /** Log a manual income event */
  async logIncome(income: {
    amount: number;
    date?: string;
    source_description?: string;
    is_recurring?: boolean;
  }): Promise<IncomeResponse> {
    const { data } = await api.post<IncomeResponse>(
      '/api/income',
      income as Record<string, unknown>
    );
    return data;
  },

  /** Get income history */
  async getIncomeHistory(): Promise<{
    events: IncomeEvent[];
    rolling_average: number;
  }> {
    const { data } = await api.get<{
      events: IncomeEvent[];
      rolling_average: number;
    }>('/api/income/history');
    return data;
  },

  /** Log a manual savings transfer */
  async logSavings(savings: {
    amount: number;
    date?: string;
    destination_description?: string;
  }): Promise<unknown> {
    const { data } = await api.post('/api/savings', savings as Record<string, unknown>);
    return data;
  },

  /** Accept a pending escalation proposal */
  async acceptEscalation(): Promise<IINConfig> {
    const { data } = await api.post<{ config: IINConfig }>(
      '/api/iin/escalation/accept'
    );
    return data.config;
  },

  /** Reject a pending escalation proposal */
  async rejectEscalation(): Promise<IINConfig> {
    const { data } = await api.post<{ config: IINConfig }>(
      '/api/iin/escalation/reject'
    );
    return data.config;
  },

  /** Get escalation forecast */
  async getEscalationForecast(params: {
    current_rate: number;
    proposed_rate: number;
    years?: number;
    monthly_income?: number;
  }): Promise<Record<string, unknown>> {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    const { data } = await api.get<Record<string, unknown>>(
      `/api/escalation/forecast?${query}`
    );
    return data;
  },
};
