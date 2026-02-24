// backend/src/services/plaidService.ts
// Server-side Plaid client — handles all sensitive Plaid operations

import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

const plaidEnv = process.env.PLAID_ENV || 'sandbox';

const configuration = new Configuration({
  basePath: PlaidEnvironments[plaidEnv as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

export const plaidServerService = {
  /** Create a link token for a user */
  async createLinkToken(userId: string): Promise<string> {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'MoneyPlanner',
      products: [Products.Transactions, Products.Auth],
      // Income is added separately via Income verification if needed
      country_codes: [CountryCode.Ca, CountryCode.Us],
      language: 'en',
      webhook: process.env.PLAID_WEBHOOK_URL,
    });
    return response.data.link_token;
  },

  /** Exchange a public token for an access token */
  async exchangePublicToken(publicToken: string): Promise<string> {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    return response.data.access_token;
  },

  /** Get accounts for an access token */
  async getAccounts(accessToken: string) {
    const response = await plaidClient.accountsGet({
      access_token: accessToken,
    });
    return response.data.accounts;
  },

  /** Get transactions */
  async getTransactions(accessToken: string, startDate: string, endDate: string) {
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    });
    return response.data;
  },

  /** Get recurring transactions (useful for income detection) */
  async getRecurringTransactions(accessToken: string) {
    const response = await plaidClient.transactionsRecurringGet({
      access_token: accessToken,
    });
    return response.data;
  },
};
