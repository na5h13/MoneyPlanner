// Default Categories — from OpenSpec Section 21, Function 3
// These are seeded on first use. Users can create/edit/delete/reorder.

import { Category } from '@/src/types';

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Home & Personal',
    icon: 'home',
    sort_order: 0,
    is_default: true,
    is_income: false,
    includes: ['rent', 'mortgage', 'utilities', 'electric', 'gas', 'water', 'internet', 'phone', 'insurance', 'gym', 'haircut', 'laundry', 'cleaning'],
  },
  {
    name: 'Food & Transportation',
    icon: 'food',
    sort_order: 1,
    is_default: true,
    is_income: false,
    includes: ['grocery', 'restaurant', 'food', 'coffee', 'uber', 'lyft', 'gas station', 'parking', 'transit', 'subway', 'doordash', 'grubhub'],
  },
  {
    name: 'Family',
    icon: 'family',
    sort_order: 2,
    is_default: true,
    is_income: false,
    includes: ['school', 'daycare', 'childcare', 'tuition', 'pediatric', 'toys', 'baby', 'kids'],
  },
  {
    name: 'Loans & Debt',
    icon: 'loan',
    sort_order: 3,
    is_default: true,
    is_income: false,
    includes: ['loan', 'student', 'credit card', 'payment', 'interest', 'finance', 'debt'],
  },
  {
    name: 'Entertainment & Other',
    icon: 'entertainment',
    sort_order: 4,
    is_default: true,
    is_income: false,
    includes: ['netflix', 'spotify', 'hulu', 'amazon', 'subscription', 'movie', 'game', 'music', 'streaming', 'shopping', 'clothing'],
  },
  {
    name: 'Uncategorized',
    icon: 'uncategorized',
    sort_order: 5,
    is_default: true,
    is_income: false,
    includes: [],
  },
];
