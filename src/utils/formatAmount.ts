// Amount formatting utility — OpenSpec conventions
// Backend stores ALL amounts as positive cents with is_income flag.
// Expenses: -$X.XX in deep sage
// Income: +$X.XX in surplus green
// Budget: $X.XX unsigned (no sign prefix)
// All amounts displayed in Source Code Pro monospace font
// API returns amounts in cents (integer) to avoid floating-point precision issues

import { colors } from '@/src/theme';

/**
 * Format cents with comma grouping.
 */
function formatDollarValue(cents: number): string {
  const abs = Math.abs(cents);
  const dollars = abs / 100;
  return dollars.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format cents using is_income flag (preferred — backend stores all amounts positive).
 * Income → +$X,XXX.XX
 * Expense → -$X,XXX.XX
 */
export function formatAmountSigned(cents: number, isIncome: boolean): string {
  const formatted = formatDollarValue(cents);
  if (cents === 0) return `$${formatted}`;
  return isIncome ? `+$${formatted}` : `-$${formatted}`;
}

/**
 * Color for amount based on is_income flag.
 */
export function amountColorFromFlag(isIncome: boolean): string {
  return isIncome ? colors.data.surplus : colors.brand.deepSage;
}

/**
 * Format cents unsigned for budget display — no +/- prefix.
 * $X,XXX.XX
 */
export function formatAmountUnsigned(cents: number): string {
  return `$${formatDollarValue(cents)}`;
}

/**
 * Legacy: Format cents to display string using sign of cents value.
 * Plaid convention: positive = debit (expense), negative = credit (income).
 * Display convention: expenses show -$X.XX, income shows +$X.XX.
 */
export function formatAmount(cents: number): string {
  const formatted = formatDollarValue(cents);
  if (cents < 0) return `+$${formatted}`;
  if (cents > 0) return `-$${formatted}`;
  return `$${formatted}`;
}

/**
 * Legacy: Get the color for an amount based on sign.
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
