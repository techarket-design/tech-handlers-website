import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to Postgres changes on a table and invalidate matching react-query
 * caches so every open panel updates instantly across tabs and users.
 *
 * Pass an array of table names — one shared channel is opened. Cleans up on unmount.
 */
export function useRealtimeTables(tables: string[]) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!tables.length) return;
    const channel = supabase.channel(`rt_${tables.join("_")}_${Math.random().toString(36).slice(2, 6)}`);
    tables.forEach(table => {
      channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table },
        () => {
          qc.invalidateQueries({ queryKey: [table] });
        }
      );
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join("|")]);
}