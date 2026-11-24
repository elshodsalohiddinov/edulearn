// API dan ma'lumot yuklash uchun umumiy hook: loading, error, qayta urinish (reload).
import { useCallback, useEffect, useRef, useState } from 'react';

export function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, loading: true, error: null });
  const reqId = useRef(0);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetcher();
      // { data, meta } yoki to'g'ridan-to'g'ri ma'lumot
      const isWrapped = res && typeof res === 'object' && 'data' in res && 'meta' in res;
      if (id === reqId.current) {
        setState({ data: isWrapped ? res.data : res, meta: isWrapped ? res.meta : null, loading: false, error: null });
      }
    } catch (error) {
      if (id === reqId.current) setState((s) => ({ ...s, loading: false, error }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { ...state, reload: load, setData: (fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })) };
}

export function useDebounce(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — EduLearn` : 'EduLearn — Onlayn ta\'lim platformasi';
  }, [title]);
}
