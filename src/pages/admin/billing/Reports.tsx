import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCustomers } from "@/hooks/useCustomers";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fmtINR = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const monthStart = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);

export default function Reports() {
  const { hasModule } = useAuth();
  const [month, setMonth] = useState(monthStart());
  const { data: customers = [] } = useCustomers();
  const { data: members = [] } = useTeamMembers();

  const { data: allocations } = useQuery({
    queryKey: ["allocations_month", month],
    queryFn: async () => {
      const { data } = await supabase.from("customer_team_allocations").select("*").eq("effective_month", month);
      return data || [];
    },
  });

  if (!hasModule("billing")) return <div className="text-center py-12 text-muted-foreground">No access</div>;

  const computed = (a: any) => {
    const c: any = customers.find((x: any) => x.id === a.customer_id);
    if (!c) return 0;
    if (a.allocation_type === "revenue_share") return Number(c.monthly_retainer || 0) * Number(a.value) / 100;
    if (a.allocation_type === "ad_spend" || a.allocation_type === "fixed_payout") return Number(a.value);
    return 0;
  };

  const byMember = useMemo(() => {
    const map = new Map<string, any[]>();
    (allocations || []).forEach((a: any) => {
      const arr = map.get(a.user_id) || [];
      arr.push(a); map.set(a.user_id, arr);
    });
    return map;
  }, [allocations]);

  const byCustomer = useMemo(() => {
    const map = new Map<string, any[]>();
    (allocations || []).forEach((a: any) => {
      const arr = map.get(a.customer_id) || [];
      arr.push(a); map.set(a.customer_id, arr);
    });
    return map;
  }, [allocations]);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-lead mb-1">Allocation Reports</h1>
      <p className="text-sm text-muted-foreground mb-4">Per-month bifurcation of customer budgets across team</p>

      <div className="mb-4 flex items-center gap-2">
        <Label className="text-xs">Month:</Label>
        <Input type="month" value={month.slice(0, 7)} onChange={(e) => setMonth(`${e.target.value}-01`)} className="w-44" />
      </div>

      <Tabs defaultValue="by_member">
        <TabsList>
          <TabsTrigger value="by_member">By Team Member</TabsTrigger>
          <TabsTrigger value="by_customer">By Customer</TabsTrigger>
        </TabsList>

        <TabsContent value="by_member">
          <div className="space-y-4">
            {Array.from(byMember.entries()).map(([uid, allocs]) => {
              const m: any = members.find((x: any) => x.user_id === uid);
              const total = allocs.reduce((s, a) => s + computed(a), 0);
              return (
                <div key={uid} className="bg-surface-white border border-border rounded-xl p-4">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-semibold">{m?.email || uid.slice(0, 8)}</h3>
                    <span className="font-mono text-sm">Total: <b>{fmtINR(total)}</b></span>
                  </div>
                  <Table>
                    <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Value</TableHead><TableHead className="text-right">Computed</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {allocs.map((a: any) => {
                        const c: any = customers.find((x: any) => x.id === a.customer_id);
                        return (
                          <TableRow key={a.id}>
                            <TableCell>{c?.company_name || "—"}</TableCell>
                            <TableCell className="text-xs capitalize">{a.allocation_type.replace("_", " ")}</TableCell>
                            <TableCell className="text-right font-mono">{a.value}{a.allocation_type === "revenue_share" ? "%" : ""}</TableCell>
                            <TableCell className="text-right font-mono">{fmtINR(computed(a))}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
            {byMember.size === 0 && <div className="text-center py-12 text-muted-foreground">No allocations for this month</div>}
          </div>
        </TabsContent>

        <TabsContent value="by_customer">
          <div className="space-y-4">
            {Array.from(byCustomer.entries()).map(([cid, allocs]) => {
              const c: any = customers.find((x: any) => x.id === cid);
              const total = allocs.reduce((s, a) => s + computed(a), 0);
              return (
                <div key={cid} className="bg-surface-white border border-border rounded-xl p-4">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-semibold">{c?.company_name || cid.slice(0, 8)}</h3>
                    <span className="font-mono text-sm">Allocated: <b>{fmtINR(total)}</b></span>
                  </div>
                  <Table>
                    <TableHeader><TableRow><TableHead>Team member</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Value</TableHead><TableHead className="text-right">Computed</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {allocs.map((a: any) => {
                        const m: any = members.find((x: any) => x.user_id === a.user_id);
                        return (
                          <TableRow key={a.id}>
                            <TableCell>{m?.email || a.user_id.slice(0, 8)}</TableCell>
                            <TableCell className="text-xs capitalize">{a.allocation_type.replace("_", " ")}</TableCell>
                            <TableCell className="text-right font-mono">{a.value}{a.allocation_type === "revenue_share" ? "%" : ""}</TableCell>
                            <TableCell className="text-right font-mono">{fmtINR(computed(a))}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
            {byCustomer.size === 0 && <div className="text-center py-12 text-muted-foreground">No allocations for this month</div>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}