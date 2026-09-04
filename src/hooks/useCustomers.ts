import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCustomers(includeChurned = true) {
  return useQuery({
    queryKey: ["customers", includeChurned],
    queryFn: async () => {
      let q = supabase.from("customers").select("*").order("company_name");
      if (!includeChurned) q = q.neq("status", "churned");
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCustomer(id?: string) {
  return useQuery({
    queryKey: ["customer", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });
}