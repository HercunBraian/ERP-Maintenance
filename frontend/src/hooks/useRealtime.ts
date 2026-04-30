import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Subscribe to row-level changes on a Supabase table and run a callback.
 * Typical use: invalidate TanStack Query caches so the UI refreshes.
 *
 * The channel name must be unique per mounted instance — pass something
 * like `rt-dashboard-mants` or include the page name.
 */
export function useRealtime(
  channel: string,
  table: string,
  onChange: () => void,
) {
  useEffect(() => {
    const ch = supabase
      .channel(channel)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        onChange,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [channel, table, onChange]);
}
