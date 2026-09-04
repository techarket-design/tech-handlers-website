import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCustomers } from "@/hooks/useCustomers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const fmtINR = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function Payments() {
  const qc = useQueryClient();
  const { hasModule, user } = useAuth();
  const { data: customers } = useCustomers();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ customer_id: "", invoice_id: "", amount: "", payment_date: new Date().toISOString().slice(0, 10), method: "bank_transfer", reference_no: "", notes: "" });

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments")
        .select("*, customer:customers(id, company_name), invoice:invoices(id, invoice_number)")
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: customerInvoices } = useQuery({
    queryKey: ["customer_open_invoices", form.customer_id],
    enabled: !!form.customer_id,
    queryFn: async () => {
      const { data } = await supabase.from("invoices").select("id, invoice_number, total, status").eq("customer_id", form.customer_id).order("issue_date", { ascending: false });
      return data || [];
    },
  });

  if (!hasModule("billing")) return <div className="text-center py-12 text-muted-foreground">No access</div>;

  const resetForm = () => {
    setEditingId(null);
    setForm({ customer_id: "", invoice_id: "", amount: "", payment_date: new Date().toISOString().slice(0, 10), method: "bank_transfer", reference_no: "", notes: "" });
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      customer_id: p.customer_id || "",
      invoice_id: p.invoice_id || "",
      amount: String(p.amount ?? ""),
      payment_date: p.payment_date,
      method: p.method || "bank_transfer",
      reference_no: p.reference_no || "",
      notes: p.notes || "",
    });
    setOpen(true);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this payment?")) return;
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Payment deleted");
    qc.invalidateQueries({ queryKey: ["payments_all"] });
  };

  const save = async () => {
    if (!form.customer_id) return toast.error("Pick a customer");
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    const payload: any = {
      customer_id: form.customer_id,
      invoice_id: form.invoice_id || null,
      amount: amt,
      payment_date: form.payment_date,
      method: form.method as any,
      reference_no: form.reference_no || null,
      notes: form.notes || null,
    };
    if (editingId) {
      const { error } = await supabase.from("payments").update(payload).eq("id", editingId);
      if (error) return toast.error(error.message);
      toast.success("Payment updated");
    } else {
      payload.created_by = user?.id;
      const { error } = await supabase.from("payments").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Payment recorded");
    }
    setOpen(false);
    resetForm();
    qc.invalidateQueries({ queryKey: ["payments_all"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-lead mb-1">Payments</h1>
          <p className="text-sm text-muted-foreground">Log received payments against customers and invoices</p>
        </div>
        <Button onClick={() => { resetForm(); setOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Record Payment</Button>
      </div>

      <div className="bg-surface-white border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Invoice</TableHead>
              <TableHead>Method</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
            {!isLoading && !payments?.length && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payments yet</TableCell></TableRow>}
            {payments?.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="text-xs">{p.payment_date}</TableCell>
                <TableCell><Link to={`/admin/customers/${p.customer?.id}`} className="hover:text-primary">{p.customer?.company_name || "—"}</Link></TableCell>
                <TableCell className="text-xs font-mono">
                  {p.invoice ? <Link to={`/admin/billing/invoices/${p.invoice.id}`} className="hover:text-primary">{p.invoice.invoice_number}</Link> : "—"}
                </TableCell>
                <TableCell className="capitalize text-xs">{p.method.replace("_", " ")}</TableCell>
                <TableCell className="text-xs font-mono">{p.reference_no || "—"}</TableCell>
                <TableCell className="text-right font-mono">{fmtINR(p.amount)}</TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Payment" : "Record Payment"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Customer</Label>
              <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v, invoice_id: "" })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{customers?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.customer_id && (
              <div>
                <Label>Invoice (optional)</Label>
                <Select value={form.invoice_id} onValueChange={(v) => setForm({ ...form, invoice_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Unallocated" /></SelectTrigger>
                  <SelectContent>{customerInvoices?.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.invoice_number} — {fmtINR(i.total)} ({i.status})</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>Date</Label><Input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} /></div>
            </div>
            <div>
              <Label>Method</Label>
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Reference number</Label><Input value={form.reference_no} onChange={(e) => setForm({ ...form, reference_no: e.target.value })} /></div>
            <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editingId ? "Save Changes" : "Record"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}