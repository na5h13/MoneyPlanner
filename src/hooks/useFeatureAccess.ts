// src/hooks/useFeatureAccess.ts
// DEV_MODE: all features unlocked simultaneously — no phase gates during development.
// Production: features unlock as user progresses through the 5-phase lifecycle.
// Section 10.9 of OpenSpec_v1_0_Unified.md

const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

export interface FeatureAccess {
  // Screens / tabs
  showHome: boolean;
  showBudget: boolean;
  showTransactions: boolean;
  showGoals: boolean;
  showIIN: boolean;
  showSettings: boolean;
  showSankey: boolean;
  showWeeklyReview: boolean;
  // Features
  automationEnabled: boolean;
  iinEnabled: boolean;
  weeklyReviewEnabled: boolean;
  escalationEnabled: boolean;
  benchmarkingEnabled: boolean;
  // Current phase label
  currentPhase: string;
}

/**
 * Returns feature access flags based on current phase.
 * In DEV_MODE, everything returns true.
 */
export function useFeatureAccess(phase?: string): FeatureAccess {
  if (DEV_MODE) {
    return {
      showHome: true,
      showBudget: true,
      showTransactions: true,
      showGoals: true,
      showIIN: true,
      showSettings: true,
      showSankey: true,
      showWeeklyReview: true,
      automationEnabled: true,
      iinEnabled: true,
      weeklyReviewEnabled: true,
      escalationEnabled: true,
      benchmarkingEnabled: true,
      currentPhase: 'DEV',
    };
  }

  const p = phase || 'OBSERVATION';

  const base: FeatureAccess = {
    showHome: false,
    showBudget: true,
    showTransactions: true,
    showGoals: false,
    showIIN: false,
    showSettings: true,
    showSankey: false,
    showWeeklyReview: false,
    automationEnabled: false,
    iinEnabled: false,
    weeklyReviewEnabled: false,
    escalationEnabled: false,
    benchmarkingEnabled: false,
    currentPhase: p,
  };

  switch (p) {
    case 'OBSERVATION':
      return base;
    case 'AUTOMATION':
      return { ...base, automationEnabled: true };
    case 'GOAL_ANCHORING':
      return { ...base, automationEnabled: true, showGoals: true };
    case 'ACTIVE_MONITORING':
      return {
        ...base,
        automationEnabled: true,
        showGoals: true,
        showHome: true,
        showSankey: true,
        showWeeklyReview: true,
        weeklyReviewEnabled: true,
      };
    case 'ACCOUNTABILITY':
      return {
        ...base,
        automationEnabled: true,
        showGoals: true,
        showHome: true,
        showSankey: true,
        showWeeklyReview: true,
        weeklyReviewEnabled: true,
        showIIN: true,
        iinEnabled: true,
        escalationEnabled: true,
        benchmarkingEnabled: true,
      };
    default:
      return base;
  }
}
