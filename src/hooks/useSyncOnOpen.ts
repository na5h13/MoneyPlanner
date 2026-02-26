// useSyncOnOpen — OpenSpec Section 21, Function 8
// Triggers a Plaid sync when the app comes to foreground if data is stale (>30 min).
// Attach in root layout so it runs globally.

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useBudgetStore } from '@/src/stores/budgetStore';

const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export function useSyncOnOpen() {
  const { syncStatus, syncTransactions } = useBudgetStore();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackground = appState.current === 'background' || appState.current === 'inactive';
      const isNowActive = nextState === 'active';

      if (wasBackground && isNowActive) {
        const lastSync = syncStatus.last_synced_at;
        const isStale = !lastSync || (Date.now() - new Date(lastSync).getTime() > STALE_THRESHOLD_MS);

        if (isStale && !syncStatus.is_syncing) {
          syncTransactions();
        }
      }

      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [syncStatus.last_synced_at, syncStatus.is_syncing, syncTransactions]);
}
