import { useEffect, useState } from 'react';
import { pingServer } from '../services/api';
import { SERVER_GIVE_UP_MS, SERVER_RETRY_MS } from '../constants/startup';

export type ServerState = 'waking' | 'awake' | 'down';

export interface ServerStatus {
  state: ServerState;
  /** How long the answer took, once it came. */
  tookMs: number | null;
}

const WAKING: ServerStatus = { state: 'waking', tookMs: null };

/** Knocks on the server until it answers. On a free host, the knock is what wakes it. */
export const useServerWake = (): ServerStatus => {
  const [status, setStatus] = useState(WAKING);

  useEffect(() => {
    const control = new AbortController();
    const began = Date.now();
    let retry: ReturnType<typeof setTimeout> | undefined;

    const knock = async () => {
      try {
        await pingServer(control.signal);
      } catch {
        if (control.signal.aborted) return;
        if (Date.now() - began >= SERVER_GIVE_UP_MS) {
          setStatus({ state: 'down', tookMs: null });
          return;
        }
        retry = setTimeout(knock, SERVER_RETRY_MS);
        return;
      }
      if (!control.signal.aborted) setStatus({ state: 'awake', tookMs: Date.now() - began });
    };

    knock();

    return () => {
      control.abort();
      clearTimeout(retry);
    };
  }, []);

  return status;
};
