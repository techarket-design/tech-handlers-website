import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCustomers } from "@/hooks/useCustomers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Receipt } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  partial: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  void: "bg-slate-200 text-slate-500",
};

const fmtINR = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function Invoices() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasModule, user } = useAuth();
  const [params] = useSearchParams();
  const { data: customers } = useCustomers();
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [customerId, setCustomerId] = useState(params.get("customer") || "");

  useEffect(() => {
    if (params.get("new") === "1") setCreateOpen(true);
  }, [params]);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices_all", filter],
    queryFn: async () => {
      let q = supabase.from("invoices").select("*, customer:customers(id, company_name)").order("issue_date", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter as any);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  if (!hasModule("billing")) return <div className="text-center py-12 text-muted-foreground">No access to Billing module</div>;

  const create = async () => {
    if (!customerId) return toast.error("Pick a customer");
    const { data: numData, error: numErr } = await supabase.rpc("next_invoice_number");
    if (numErr) return toast.error(numErr.message);
    const due = new Date(); due.setDate(due.getDate() + 14);
    const { data, error } = await supabase.from("invoices").insert({
      customer_id: customerId,
      invoice_number: numData,
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: due.toISOString().slice(0, 10),
      status: "draft",
      created_by: user?.id,
    }).select().single();
    if (error) return toast.error(error.message);
    setCreateOpen(false);
    qc.invalidateQueries({ queryKey: ["invoices_all"] });
    navigate(`/admin/billing/invoices/${data.id}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-lead mb-1">Invoices</h1>
          <p className="text-sm text-muted-foreground">Create, track and bill customers</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" /> New Invoice</Button>
      </div>

      <div className="mb-3 flex gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="void">Void</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-surface-white border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead><TableHead>Customer</TableHead>
              <TableHead>Issue</TableHead><TableHead>Due</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
            {!isLoading && !invoices?.length && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No invoices yet</TableCell></TableRow>
            )}
            {invoices?.map((inv: any) => (
              <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/admin/billing/invoices/${inv.id}`)}>
                <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                <TableCell>
                  <Link to={`/admin/customers/${inv.customer?.id}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary">
                    {inv.customer?.company_name || "—"}
                  </Link>
                </TableCell>
                <TableCell className="text-xs">{inv.issue_date}</TableCell>
                <TableCell className="text-xs">{inv.due_date || "—"}</TableCell>
                <TableCell><Badge className={`${STATUS_COLORS[inv.status]} capitalize border-0`}>{inv.status}</Badge></TableCell>
                <TableCell className="text-right font-mono">{fmtINR(inv.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle><Receipt className="h-5 w-5 inline mr-2" /> New Invoice</DialogTitle></DialogHeader>
          <div>
            <Label>Customer</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>{customers?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create & Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}