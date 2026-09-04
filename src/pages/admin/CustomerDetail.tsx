import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCustomer } from "@/hooks/useCustomers";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, Building2, FileText, Wallet, Users, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const ALLOC_TYPES = [
  { value: "revenue_share", label: "Revenue Share (%)", unit: "%" },
  { value: "ad_spend", label: "Ad Spend (₹)", unit: "₹" },
  { value: "hours", label: "Hours / month", unit: "hrs" },
  { value: "fixed_payout", label: "Fixed Payout (₹)", unit: "₹" },
] as const;

const fmtINR = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const monthStart = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
const addMonths = (iso: string, n: number) => {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return d.toISOString().slice(0, 10);
};

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasModule, isAdmin, user } = useAuth();
  const { data: customer, isLoading } = useCustomer(id);
  const { data: members = [] } = useTeamMembers();
  const [month, setMonth] = useState(monthStart());

  const { data: invoices } = useQuery({
    queryKey: ["customer_invoices", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("invoices").select("*").eq("customer_id", id!).order("issue_date", { ascending: false });
      return data || [];
    },
  });

  const { data: payments } = useQuery({
    queryKey: ["customer_payments", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("*").eq("customer_id", id!).order("payment_date", { ascending: false });
      return data || [];
    },
  });

  const { data: allocations } = useQuery({
    queryKey: ["customer_allocations", id, month],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("customer_team_allocations")
        .select("*")
        .eq("customer_id", id!)
        .eq("effective_month", month);
      return data || [];
    },
  });

  const { data: linkedTasks } = useQuery({
    queryKey: ["customer_tasks", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("id, title, status, priority, due_date").eq("customer_id", id!).order("created_at", { ascending: false });
      return data || [];
    },
  });

  if (!hasModule("customers")) return <div className="text-center py-12 text-muted-foreground">No access</div>;
  if (isLoading || !customer) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  const totalBilled = (invoices || []).reduce((s, i) => s + Number(i.total), 0);
  const totalPaid = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const outstanding = totalBilled - totalPaid;

  const updateField = async (changes: any) => {
    const { error } = await supabase.from("customers").update(changes).eq("id", customer.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["customer", customer.id] });
    qc.invalidateQueries({ queryKey: ["customers"] });
  };

  const deleteCustomer = async () => {
    if (!confirm("Delete this customer and all related invoices, payments and allocations?")) return;
    const { error } = await supabase.from("customers").delete().eq("id", customer.id);
    if (error) return toast.error(error.message);
    toast.success("Customer deleted");
    navigate("/admin/customers");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-3">
        <Link to="/admin/customers"><ArrowLeft className="h-4 w-4 mr-1" /> All Customers</Link>
      </Button>

      <div className="bg-surface-white border border-border rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Input
                defaultValue={customer.company_name}
                onBlur={(e) => e.target.value !== customer.company_name && updateField({ company_name: e.target.value })}
                className="text-2xl font-display font-bold border-0 px-0 h-auto py-0 focus-visible:ring-0"
              />
              <p className="text-xs text-muted-foreground">Customer since {customer.created_at && format(new Date(customer.created_at), "MMM yyyy")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={customer.status} onValueChange={(v) => updateField({ status: v })}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
              </SelectContent>
            </Select>
            {isAdmin && (
              <Button variant="outline" size="icon" className="text-destructive" onClick={deleteCustomer}><Trash2 className="h-4 w-4" /></Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-border">
          <Stat label="Total Billed" value={fmtINR(totalBilled)} />
          <Stat label="Total Paid" value={fmtINR(totalPaid)} accent="text-green-600" />
          <Stat label="Outstanding" value={fmtINR(outstanding)} accent={outstanding > 0 ? "text-orange-600" : ""} />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview"><Building2 className="h-3.5 w-3.5 mr-1.5" /> Overview</TabsTrigger>
          <TabsTrigger value="team"><Users className="h-3.5 w-3.5 mr-1.5" /> Team & Budget</TabsTrigger>
          <TabsTrigger value="invoices"><FileText className="h-3.5 w-3.5 mr-1.5" /> Invoices ({invoices?.length || 0})</TabsTrigger>
          <TabsTrigger value="payments"><Wallet className="h-3.5 w-3.5 mr-1.5" /> Payments ({payments?.length || 0})</TabsTrigger>
          <TabsTrigger value="tasks"><ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Tasks ({linkedTasks?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="bg-surface-white border border-border rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Contact Name" value={customer.contact_name} onSave={(v) => updateField({ contact_name: v })} />
            <Field label="Email" value={customer.email} onSave={(v) => updateField({ email: v })} />
            <Field label="Phone" value={customer.phone} onSave={(v) => updateField({ phone: v })} />
            <Field label="Website" value={customer.website} onSave={(v) => updateField({ website: v })} />
            <Field label="GSTIN / Tax ID" value={customer.tax_id} onSave={(v) => updateField({ tax_id: v })} />
            <Field label="Currency" value={customer.currency} onSave={(v) => updateField({ currency: v })} />
            <Field label="Monthly Retainer (₹)" value={customer.monthly_retainer} type="number" onSave={(v) => updateField({ monthly_retainer: Number(v) || 0 })} />
            <Field label="Monthly Ad Budget (₹)" value={customer.monthly_ad_budget} type="number" onSave={(v) => updateField({ monthly_ad_budget: Number(v) || 0 })} />
            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground">Address</Label>
              <Textarea defaultValue={customer.address || ""} rows={2} onBlur={(e) => updateField({ address: e.target.value || null })} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea defaultValue={customer.notes || ""} rows={3} onBlur={(e) => updateField({ notes: e.target.value || null })} />
            </div>
          </div>
        </TabsContent>

        {/* Team & Budget */}
        <TabsContent value="team">
          <TeamBudgetTab
            customer={customer}
            month={month}
            setMonth={setMonth}
            allocations={allocations || []}
            members={members}
            onChange={() => qc.invalidateQueries({ queryKey: ["customer_allocations", id, month] })}
            createdBy={user?.id}
          />
        </TabsContent>

        {/* Invoices */}
        <TabsContent value="invoices">
          <div className="bg-surface-white border border-border rounded-xl p-3">
            <div className="flex justify-end mb-2">
              <Button size="sm" onClick={() => navigate(`/admin/billing/invoices?customer=${customer.id}&new=1`)}>
                <Plus className="h-4 w-4 mr-1" /> New Invoice
              </Button>
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Invoice</TableHead><TableHead>Issue</TableHead><TableHead>Due</TableHead>
                <TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {!invoices?.length && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No invoices</TableCell></TableRow>}
                {invoices?.map((inv: any) => (
                  <TableRow key={inv.id} className="cursor-pointer" onClick={() => navigate(`/admin/billing/invoices/${inv.id}`)}>
                    <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                    <TableCell className="text-xs">{inv.issue_date}</TableCell>
                    <TableCell className="text-xs">{inv.due_date || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{inv.status}</Badge></TableCell>
                    <TableCell className="text-right font-mono">{fmtINR(inv.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments">
          <div className="bg-surface-white border border-border rounded-xl p-3">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead><TableHead>Method</TableHead><TableHead>Reference</TableHead>
                <TableHead>Invoice</TableHead><TableHead className="text-right">Amount</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {!payments?.length && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payments</TableCell></TableRow>}
                {payments?.map((p: any) => {
                  const inv = invoices?.find((i: any) => i.id === p.invoice_id);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{p.payment_date}</TableCell>
                      <TableCell className="capitalize text-xs">{p.method.replace("_", " ")}</TableCell>
                      <TableCell className="text-xs font-mono">{p.reference_no || "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{inv?.invoice_number || "—"}</TableCell>
                      <TableCell className="text-right font-mono">{fmtINR(p.amount)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tasks */}
        <TabsContent value="tasks">
          <div className="bg-surface-white border border-border rounded-xl p-3">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Task</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Due</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {!linkedTasks?.length && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No linked tasks</TableCell></TableRow>}
                {linkedTasks?.map((t: any) => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => navigate(`/admin/tasks/${t.id}`)}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{t.status.replace("_", " ")}</Badge></TableCell>
                    <TableCell className="capitalize text-xs">{t.priority}</TableCell>
                    <TableCell className="text-xs">{t.due_date ? format(new Date(t.due_date), "MMM d, yyyy") : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-display font-bold ${accent || "text-lead"}`}>{value}</p>
    </div>
  );
}

function Field({ label, value, onSave, type = "text" }: any) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type={type}
        defaultValue={value ?? ""}
        onBlur={(e) => e.target.value !== String(value ?? "") && onSave(e.target.value)}
      />
    </div>
  );
}

function TeamBudgetTab({ customer, month, setMonth, allocations, members, onChange, createdBy }: any) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ user_id: "", allocation_type: "revenue_share", value: "", notes: "" });

  const add = async () => {
    if (!draft.user_id) return toast.error("Pick a team member");
    const v = Number(draft.value);
    if (isNaN(v)) return toast.error("Enter a value");
    const { error } = await supabase.from("customer_team_allocations").insert({
      customer_id: customer.id,
      user_id: draft.user_id,
      allocation_type: draft.allocation_type as any,
      value: v,
      effective_month: month,
      notes: draft.notes || null,
      created_by: createdBy,
    });
    if (error) return toast.error(error.message);
    toast.success("Allocation added");
    setDraft({ user_id: "", allocation_type: "revenue_share", value: "", notes: "" });
    setAdding(false);
    onChange();
  };

  const remove = async (allocId: string) => {
    const { error } = await supabase.from("customer_team_allocations").delete().eq("id", allocId);
    if (error) return toast.error(error.message);
    onChange();
  };

  const copyPrevious = async () => {
    const prev = addMonths(month, -1);
    const { data } = await supabase.from("customer_team_allocations").select("*").eq("customer_id", customer.id).eq("effective_month", prev);
    if (!data?.length) return toast.error("Nothing to copy from previous month");
    const rows = data.map((d: any) => ({
      customer_id: customer.id, user_id: d.user_id, allocation_type: d.allocation_type,
      value: d.value, effective_month: month, notes: d.notes, created_by: createdBy,
    }));
    const { error } = await supabase.from("customer_team_allocations").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`Copied ${rows.length} allocations`);
    onChange();
  };

  const computed = (a: any) => {
    if (a.allocation_type === "revenue_share") return Number(customer.monthly_retainer || 0) * Number(a.value) / 100;
    if (a.allocation_type === "ad_spend" || a.allocation_type === "fixed_payout") return Number(a.value);
    return 0;
  };

  const sumByType = (t: string) => allocations.filter((a: any) => a.allocation_type === t).reduce((s: number, a: any) => s + Number(a.value), 0);
  const sharePct = sumByType("revenue_share");
  const adSum = sumByType("ad_spend");

  return (
    <div className="bg-surface-white border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Month:</Label>
          <Input type="month" value={month.slice(0, 7)} onChange={(e) => setMonth(`${e.target.value}-01`)} className="w-44" />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copyPrevious}>Copy from previous month</Button>
          <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-4 w-4 mr-1" /> Add allocation</Button>
        </div>
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground mb-3">
        <span>Revenue share allocated: <b className={sharePct > 100 ? "text-destructive" : "text-foreground"}>{sharePct}%</b> / 100%</span>
        <span>Ad spend allocated: <b>{fmtINR(adSum)}</b> / {fmtINR(customer.monthly_ad_budget || 0)}</span>
      </div>

      {adding && (
        <div className="border border-dashed border-border rounded-lg p-3 mb-3 grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
          <div>
            <Label className="text-xs">Team member</Label>
            <Select value={draft.user_id} onValueChange={(v) => setDraft({ ...draft, user_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{members.map((m: any) => <SelectItem key={m.user_id} value={m.user_id}>{m.email}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={draft.allocation_type} onValueChange={(v) => setDraft({ ...draft, allocation_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ALLOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Value</Label>
            <Input type="number" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Input value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={add}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader><TableRow>
          <TableHead>Team member</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Value</TableHead>
          <TableHead className="text-right">Computed (₹)</TableHead><TableHead>Notes</TableHead><TableHead></TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {!allocations.length && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No allocations for this month</TableCell></TableRow>}
          {allocations.map((a: any) => {
            const m = members.find((x: any) => x.user_id === a.user_id);
            const t = ALLOC_TYPES.find(x => x.value === a.allocation_type);
            return (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{m?.email || a.user_id.slice(0, 8)}</TableCell>
                <TableCell className="text-xs">{t?.label || a.allocation_type}</TableCell>
                <TableCell className="text-right font-mono">{a.value}{t?.unit === "%" ? "%" : ""}</TableCell>
                <TableCell className="text-right font-mono">{computed(a) > 0 ? fmtINR(computed(a)) : "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{a.notes}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}