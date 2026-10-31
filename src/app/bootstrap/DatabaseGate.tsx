import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { openAndMigrate } from '../../database/client/database';
import { useTheme } from '../../theme/ThemeProvider';

type GateStatus = 'loading' | 'ready' | 'error';

type DatabaseGateProps = {
  children: ReactNode;
};

export function DatabaseGate({ children }: DatabaseGateProps) {
  const theme = useTheme();
  const [status, setStatus] = useState<GateStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    openAndMigrate()
      .then(() => {
        if (!cancelled) {
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (status === 'loading') {
    return (
      <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
        <LoadingState message="Preparing your training record" />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <ErrorState
        title="Could not open training record"
        message="STRIV keeps workouts on this device. The local database did not open, so nothing was changed."
        onRetry={() => {
          setStatus('loading');
          setAttempt(current => current + 1);
        }}
      />
    );
  }

  return children;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
