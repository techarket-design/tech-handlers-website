import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TeamMember = { user_id: string; role: string; email: string };

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team_members_list"],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase.functions.invoke("list-team-members");
      if (error) throw error;
      // dedupe by user_id (a user may have multiple roles)
      const seen = new Set<string>();
      const out: TeamMember[] = [];
      for (const m of (data || []) as TeamMember[]) {
        if (seen.has(m.user_id)) continue;
        seen.add(m.user_id);
        out.push(m);
      }
      return out;
    },
    staleTime: 5 * 60 * 1000,
  });
}