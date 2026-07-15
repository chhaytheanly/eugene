import { useState, useCallback } from "react";

export function useAsync<T, Args extends any[] = []>(asyncFn: (...args: Args) => Promise<T>, initialData?: T) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (...args: Args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await asyncFn(...args);
      setData(res);
      return res;
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(err.message || "An error occurred"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  return { data, loading, error, execute, setData, setError };
}
