// src/services/plaid.ts
// Plaid Link integration — handles the bank connection flow
// Token exchange happens server-side via api.ts → Flask backend

import { api } from './api';

interface LinkTokenResponse {
  link_token: string;
}

interface PlaidAccount {
  id: string;
  item_id: string;
  name: string;
  type: string;
  subtype: string | null;
  mask: string;
  institution_name: string;
  current_balance: number | null;
  available_balance: number | null;
}

interface TransactionData {
  transactions: Array<{
    transaction_id: string;
    date: string;
    name: string;
    merchant: string;
    amount: number;
    category: string;
    budget_category: string;
    pending: boolean;
    account_id: string;
    item_id: string;
  }>;
  count: number;
}

interface IncomeStream {
  name: string;
  amount: number;
  frequency: string;
  occurrences: number;
  is_active: boolean;
}

export const plaidService = {
  /** Get a link token from the backend (required to open Plaid Link) */
  async createLinkToken(): Promise<string> {
    const { data } = await api.post<LinkTokenResponse>(
      '/api/plaid/create-link-token'
    );
    return data.link_token;
  },

  /** Exchange public token after user connects bank */
  async exchangePublicToken(
    publicToken: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    await api.post('/api/plaid/exchange-token', {
      public_token: publicToken,
      metadata,
    });
  },

  /** Get user's connected bank accounts */
  async getAccounts(): Promise<PlaidAccount[]> {
    const { data } = await api.get<{ accounts: PlaidAccount[] }>(
      '/api/plaid/accounts'
    );
    return data.accounts;
  },

  /** Sync all accounts' transactions */
  async syncAll(): Promise<Record<string, unknown>> {
    const { data } = await api.post<{ results: Record<string, unknown> }>(
      '/api/plaid/sync'
    );
    return data.results;
  },

  /** Get transactions with optional date filters */
  async getTransactions(
    startDate?: string,
    endDate?: string
  ): Promise<TransactionData> {
    const { data } = await api.post<TransactionData>(
      '/api/plaid/transactions',
      {
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
      }
    );
    return data;
  },

  /** Get detected income streams */
  async getIncomeData(): Promise<{ income_streams: IncomeStream[] }> {
    const { data } = await api.get<{ income_streams: IncomeStream[] }>(
      '/api/plaid/income'
    );
    return data;
  },

  /** Disconnect a bank account */
  async disconnectAccount(itemId: string): Promise<void> {
    await api.post(`/api/plaid/disconnect/${itemId}`);
  },
};
