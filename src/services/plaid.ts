// src/services/plaid.ts
// Plaid Link integration — handles the bank connection flow
// Token exchange happens server-side via api.ts → Railway backend

import { api } from './api';

interface LinkTokenResponse {
  link_token: string;
  expiration: string;
}

interface PlaidAccount {
  id: string;
  name: string;
  type: string;
  subtype: string;
  mask: string;
  institutionName: string;
}

export const plaidService = {
  /** Get a link token from our backend (required to open Plaid Link) */
  async createLinkToken(): Promise<string> {
    const { data } = await api.post<LinkTokenResponse>('/api/plaid/create-link-token');
    return data.link_token;
  },

  /** Exchange public token after user connects bank (done server-side) */
  async exchangePublicToken(publicToken: string, metadata: Record<string, unknown>): Promise<void> {
    await api.post('/api/plaid/exchange-token', {
      public_token: publicToken,
      metadata,
    });
  },

  /** Get user's connected accounts */
  async getAccounts(): Promise<PlaidAccount[]> {
    const { data } = await api.get<{ accounts: PlaidAccount[] }>('/api/plaid/accounts');
    return data.accounts;
  },

  /** Get transactions for IIN analysis and budget automation */
  async getTransactions(startDate: string, endDate: string) {
    const { data } = await api.post('/api/plaid/transactions', {
      start_date: startDate,
      end_date: endDate,
    });
    return data;
  },

  /** Get income data for IIN (Income Increase Neutralization) */
  async getIncomeData() {
    const { data } = await api.get('/api/plaid/income');
    return data;
  },

  /** Disconnect a bank account */
  async disconnectAccount(accountId: string): Promise<void> {
    await api.delete(`/api/plaid/accounts/${accountId}`);
  },
};
