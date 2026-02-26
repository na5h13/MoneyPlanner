// Plaid client wrapper — all Plaid API interactions go through here
// Plaid is READ-ONLY. App never writes to bank accounts.

import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from 'plaid';

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || '';
const PLAID_SECRET = process.env.PLAID_SECRET || '';
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';

const envMap: Record<string, string> = {
  sandbox: PlaidEnvironments.sandbox,
  production: PlaidEnvironments.production,
};

const configuration = new Configuration({
  basePath: envMap[PLAID_ENV] || PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

export interface PlaidTransactionData {
  transaction_id: string;
  date: string;
  name: string;
  merchant_name: string | null;
  amount: number;           // Plaid: positive = expense, negative = income
  pending: boolean;
  account_id: string;
  payment_channel: string;
  personal_finance_category: string[];
}

export async function createLinkToken(userId: string): Promise<string> {
  // Minimal linkTokenCreate — matches working reference projects.
  // OAuth support (redirect_uri, android_package_name) only added
  // when env vars are set AND registered in Plaid Dashboard.
  const request: any = {
    products: [Products.Transactions],
    client_name: 'Keel',
    country_codes: [CountryCode.Ca],
    language: 'en',
    user: { client_user_id: userId },
  };

  // OAuth support: only add if registered in Plaid Dashboard
  const redirectUri = process.env.PLAID_REDIRECT_URI;
  const androidPkg = process.env.PLAID_ANDROID_PACKAGE_NAME;
  if (redirectUri) {
    request.redirect_uri = redirectUri;
  }
  if (androidPkg) {
    request.android_package_name = androidPkg;
  }

  console.log('createLinkToken:', {
    userId,
    env: PLAID_ENV,
    hasClientId: !!PLAID_CLIENT_ID,
    hasSecret: !!PLAID_SECRET,
    redirect_uri: redirectUri || '(not set)',
    android_package_name: androidPkg || '(not set)',
  });

  const response = await client.linkTokenCreate(request);
  return response.data.link_token;
}

export async function exchangePublicToken(publicToken: string): Promise<{
  access_token: string;
  item_id: string;
}> {
  const response = await client.itemPublicTokenExchange({
    public_token: publicToken,
  });
  return {
    access_token: response.data.access_token,
    item_id: response.data.item_id,
  };
}

export async function getAccounts(accessToken: string): Promise<Array<{
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  balance_current: number | null;
  balance_available: number | null;
  balance_limit: number | null;
}>> {
  const response = await client.accountsGet({ access_token: accessToken });
  return response.data.accounts.map((a) => ({
    account_id: a.account_id,
    name: a.name,
    official_name: a.official_name,
    type: a.type,
    subtype: a.subtype,
    mask: a.mask,
    balance_current: a.balances.current,
    balance_available: a.balances.available,
    balance_limit: a.balances.limit,
  }));
}

export interface SyncResult {
  added: PlaidTransactionData[];
  modified: PlaidTransactionData[];
  removed: string[];   // transaction_ids
  next_cursor: string;
  has_more: boolean;
}

function mapTransaction(t: any): PlaidTransactionData {
  return {
    transaction_id: t.transaction_id,
    date: t.date,
    name: t.name,
    merchant_name: t.merchant_name || null,
    amount: t.amount,
    pending: t.pending,
    account_id: t.account_id,
    payment_channel: t.payment_channel || 'other',
    personal_finance_category: t.personal_finance_category
      ? [t.personal_finance_category.primary, t.personal_finance_category.detailed]
      : [],
  };
}

/**
 * Sync transactions using cursor-based pagination.
 * Loops until has_more is false.
 */
export async function syncTransactions(
  accessToken: string,
  cursor: string
): Promise<{
  added: PlaidTransactionData[];
  modified: PlaidTransactionData[];
  removed: string[];
  next_cursor: string;
}> {
  const allAdded: PlaidTransactionData[] = [];
  const allModified: PlaidTransactionData[] = [];
  const allRemoved: string[] = [];
  let currentCursor = cursor;
  let hasMore = true;

  while (hasMore) {
    const response = await client.transactionsSync({
      access_token: accessToken,
      cursor: currentCursor || undefined,
    });

    const data = response.data;

    for (const t of data.added) {
      allAdded.push(mapTransaction(t));
    }
    for (const t of data.modified) {
      allModified.push(mapTransaction(t));
    }
    for (const t of data.removed) {
      if (t.transaction_id) {
        allRemoved.push(t.transaction_id);
      }
    }

    currentCursor = data.next_cursor;
    hasMore = data.has_more;
  }

  return {
    added: allAdded,
    modified: allModified,
    removed: allRemoved,
    next_cursor: currentCursor,
  };
}

export async function getRecurringTransactions(accessToken: string, accountIds: string[]) {
  const response = await client.transactionsRecurringGet({
    access_token: accessToken,
    account_ids: accountIds,
  });
  return response.data;
}
