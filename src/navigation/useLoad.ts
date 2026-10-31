import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';

import { visibleError } from '../features/training/errors';

export function useLoad<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);
  const loadRef = useRef(load);
  loadRef.current = load;

  const reload = useCallback(async () => {
    try {
      const next = await loadRef.current();
      setData(next);
      setError(null);
    } catch (err) {
      setError(visibleError(err, 'This screen could not be loaded.'));
    } finally {
      setPending(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      load()
        .then(next => {
          if (!active) {
            return;
          }
          setData(next);
          setError(null);
        })
        .catch(err => {
          if (!active) {
            return;
          }
          setError(visibleError(err, 'This screen could not be loaded.'));
        })
        .finally(() => {
          if (active) {
            setPending(false);
          }
        });
      return () => {
        active = false;
      };
    }, [load]),
  );

  return {
    data,
    error,
    loading: pending && data === null,
    reload,
  };
}
