// Amount formatting utility — OpenSpec conventions
// Expenses: -$X.XX in deep sage
// Income: +$X.XX in surplus green
// All amounts displayed in Source Code Pro monospace font
// API returns amounts in cents (integer) to avoid floating-point precision issues

import { colors } from '@/src/theme';

/**
 * Format cents to display string.
 * Plaid convention: positive = debit (expense), negative = credit (income).
 * Display convention: expenses show -$X.XX, income shows +$X.XX.
 */
export function formatAmount(cents: number): string {
  const abs = Math.abs(cents);
  const dollars = (abs / 100).toFixed(2);
  // Plaid: positive = money leaving account (expense)
  // Plaid: negative = money entering account (income)
  if (cents < 0) {
    // Income (credit)
    return `+$${dollars}`;
  }
  if (cents > 0) {
    // Expense (debit)
    return `-$${dollars}`;
  }
  return `$${dollars}`;
}

/**
 * Get the color for an amount based on sign.
 * Income (negative in Plaid) → surplus green
 * Expense (positive in Plaid) → deep sage
 * Zero → neutral
 */
export function amountColor(cents: number): string {
  if (cents < 0) return colors.data.surplus;   // Income
  if (cents > 0) return colors.brand.deepSage;  // Expense
  return colors.data.neutral;
}

/**
 * Format a dollar amount (already in dollars, not cents).
 */
export function formatDollars(dollars: number): string {
  const abs = Math.abs(dollars);
  const formatted = abs.toFixed(2);
  if (dollars < 0) return `+$${formatted}`;
  if (dollars > 0) return `-$${formatted}`;
  return `$${formatted}`;
}

/**
 * Truncate merchant name at 24 characters with ellipsis per OpenSpec.
 */
export function truncateMerchant(name: string): string {
  if (name.length <= 24) return name;
  return name.slice(0, 24) + '...';
}
