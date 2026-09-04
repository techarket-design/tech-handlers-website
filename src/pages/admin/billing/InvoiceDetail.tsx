import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Download, Wallet } from "lucide-react";
import { toast } from "sonner";
import { generateInvoicePdf } from "@/lib/invoicePdf";

const fmtINR = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasModule, isAdmin, user } = useAuth();
  const [payOpen, setPayOpen] = useState(false);
  const [pay, setPay] = useState({ amount: "", payment_date: new Date().toISOString().slice(0, 10), method: "bank_transfer", reference_no: "", notes: "" });

  const { data: invoice } = useQuery({
    queryKey: ["invoice", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*, customer:customers(*)").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: items } = useQuery({
    queryKey: ["invoice_items", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("invoice_line_items").select("*").eq("invoice_id", id!).order("sort_order");
      return data || [];
    },
  });

  const { data: payments } = useQuery({
    queryKey: ["invoice_payments", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("*").eq("invoice_id", id!).order("payment_date", { ascending: false });
      return data || [];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["site_settings_billing"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").limit(1).single();
      return data;
    },
  });

  const subtotal = useMemo(() => (items || []).reduce((s, i: any) => s + Number(i.amount), 0), [items]);
  const taxAmt = (subtotal - Number(invoice?.discount_amount || 0)) * Number(invoice?.tax_percent || 0) / 100;
  const total = subtotal - Number(invoice?.discount_amount || 0) + taxAmt;
  const paid = (payments || []).reduce((s, p: any) => s + Number(p.amount), 0);

  // Recalc totals on items/discount/tax change
  useEffect(() => {
    if (!invoice) return;
    const needsUpdate = Math.abs(Number(invoice.subtotal) - subtotal) > 0.01
      || Math.abs(Number(invoice.tax_amount) - taxAmt) > 0.01
      || Math.abs(Number(invoice.total) - total) > 0.01;
    if (needsUpdate) {
      const balance = total - paid;
      let nextStatus: string = invoice.status;
      if (invoice.status !== "draft" && invoice.status !== "void") {
        if (paid <= 0) nextStatus = invoice.status === "overdue" ? "overdue" : "sent";
        else if (paid >= total) nextStatus = "paid";
        else nextStatus = "partial";
      }
      void supabase.from("invoices").update({
        subtotal, tax_amount: taxAmt, total, status: nextStatus as any,
      }).eq("id", invoice.id).then(() => qc.invalidateQueries({ queryKey: ["invoice", invoice.id] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, taxAmt, total, paid]);

  if (!hasModule("billing")) return <div className="text-center py-12 text-muted-foreground">No access</div>;
  if (!invoice) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  const update = async (changes: any) => {
    const { error } = await supabase.from("invoices").update(changes).eq("id", invoice.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["invoice", invoice.id] });
    qc.invalidateQueries({ queryKey: ["invoices_all"] });
  };

  const addItem = async () => {
    const { error } = await supabase.from("invoice_line_items").insert({
      invoice_id: invoice.id, description: "New item", quantity: 1, unit_price: 0, amount: 0,
      sort_order: (items?.length || 0),
    });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["invoice_items", invoice.id] });
  };

  const updateItem = async (itemId: string, changes: any) => {
    const merged = { ...changes };
    if ("quantity" in changes || "unit_price" in changes) {
      const it: any = items!.find((x: any) => x.id === itemId);
      const q = Number(changes.quantity ?? it.quantity);
      const u = Number(changes.unit_price ?? it.unit_price);
      merged.amount = q * u;
    }
    const { error } = await supabase.from("invoice_line_items").update(merged).eq("id", itemId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["invoice_items", invoice.id] });
  };

  const deleteItem = async (itemId: string) => {
    await supabase.from("invoice_line_items").delete().eq("id", itemId);
    qc.invalidateQueries({ queryKey: ["invoice_items", invoice.id] });
  };

  const recordPayment = async () => {
    const amt = Number(pay.amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    const { error } = await supabase.from("payments").insert({
      invoice_id: invoice.id, customer_id: invoice.customer_id, amount: amt,
      payment_date: pay.payment_date, method: pay.method as any,
      reference_no: pay.reference_no || null, notes: pay.notes || null, created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    setPayOpen(false);
    setPay({ amount: "", payment_date: new Date().toISOString().slice(0, 10), method: "bank_transfer", reference_no: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["invoice_payments", invoice.id] });
    toast.success("Payment recorded");
  };

  const downloadPdf = () => {
    const doc = generateInvoicePdf({
      invoice: {
        invoice_number: invoice.invoice_number, issue_date: invoice.issue_date,
        due_date: invoice.due_date, status: invoice.status,
        subtotal: Number(invoice.subtotal), tax_percent: Number(invoice.tax_percent),
        tax_amount: Number(invoice.tax_amount), discount_amount: Number(invoice.discount_amount),
        total: Number(invoice.total), currency: invoice.currency,
        notes: invoice.notes, terms: invoice.terms,
      },
      customer: invoice.customer,
      company: {
        name: settings?.site_name || "Tech Handlers",
        email: settings?.contact_email, phone: settings?.contact_phone, address: settings?.contact_address,
      },
      lineItems: (items || []) as any,
      payments: (payments || []) as any,
    });
    doc.save(`${invoice.invoice_number}.pdf`);
  };

  const deleteInvoice = async () => {
    if (!confirm("Delete this invoice and its line items? Payments will be unlinked.")) return;
    const { error } = await supabase.from("invoices").delete().eq("id", invoice.id);
    if (error) return toast.error(error.message);
    toast.success("Invoice deleted");
    navigate("/admin/billing/invoices");
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-3">
        <Link to="/admin/billing/invoices"><ArrowLeft className="h-4 w-4 mr-1" /> All Invoices</Link>
      </Button>

      <div className="bg-surface-white border border-border rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-lead">{invoice.invoice_number}</h1>
            <Link to={`/admin/customers/${invoice.customer?.id}`} className="text-sm text-primary hover:underline">{invoice.customer?.company_name}</Link>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={invoice.status} onValueChange={(v) => update({ status: v })}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setPayOpen(true)}><Wallet className="h-4 w-4 mr-1" /> Record Payment</Button>
            <Button size="sm" onClick={downloadPdf}><Download className="h-4 w-4 mr-1" /> PDF</Button>
            {isAdmin && <Button variant="outline" size="icon" className="text-destructive" onClick={deleteInvoice}><Trash2 className="h-4 w-4" /></Button>}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div>
            <Label className="text-xs text-muted-foreground">Issue date</Label>
            <Input type="date" defaultValue={invoice.issue_date} onBlur={(e) => update({ issue_date: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Due date</Label>
            <Input type="date" defaultValue={invoice.due_date || ""} onBlur={(e) => update({ due_date: e.target.value || null })} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Tax %</Label>
            <Input type="number" defaultValue={invoice.tax_percent} onBlur={(e) => update({ tax_percent: Number(e.target.value) || 0 })} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Discount (₹)</Label>
            <Input type="number" defaultValue={invoice.discount_amount} onBlur={(e) => update({ discount_amount: Number(e.target.value) || 0 })} />
          </div>
        </div>
      </div>

      <div className="bg-surface-white border border-border rounded-xl p-3 mb-4">
        <div className="flex justify-between items-center mb-2 px-2">
          <h3 className="font-semibold text-sm">Line Items</h3>
          <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Add item</Button>
        </div>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Description</TableHead>
            <TableHead className="w-20 text-right">Qty</TableHead>
            <TableHead className="w-32 text-right">Unit Price</TableHead>
            <TableHead className="w-32 text-right">Amount</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {!items?.length && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No items — click Add to start</TableCell></TableRow>}
            {items?.map((it: any) => (
              <TableRow key={it.id}>
                <TableCell><Input defaultValue={it.description} onBlur={(e) => e.target.value !== it.description && updateItem(it.id, { description: e.target.value })} /></TableCell>
                <TableCell><Input type="number" className="text-right" defaultValue={it.quantity} onBlur={(e) => updateItem(it.id, { quantity: Number(e.target.value) || 0 })} /></TableCell>
                <TableCell><Input type="number" className="text-right" defaultValue={it.unit_price} onBlur={(e) => updateItem(it.id, { unit_price: Number(e.target.value) || 0 })} /></TableCell>
                <TableCell className="text-right font-mono">{fmtINR(it.amount)}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => deleteItem(it.id)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-xs space-y-1.5 text-sm">
            <Row label="Subtotal" value={fmtINR(subtotal)} />
            {Number(invoice.discount_amount) > 0 && <Row label="Discount" value={`- ${fmtINR(invoice.discount_amount)}`} />}
            {Number(invoice.tax_percent) > 0 && <Row label={`Tax (${invoice.tax_percent}%)`} value={fmtINR(taxAmt)} />}
            <Row label="Total" value={fmtINR(total)} bold />
            {paid > 0 && <Row label="Paid" value={fmtINR(paid)} accent="text-green-600" />}
            {paid > 0 && <Row label="Balance Due" value={fmtINR(total - paid)} bold accent={total - paid > 0 ? "text-orange-600" : ""} />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-white border border-border rounded-xl p-4">
          <Label className="text-xs text-muted-foreground">Notes (visible on PDF)</Label>
          <Textarea defaultValue={invoice.notes || ""} rows={3} onBlur={(e) => update({ notes: e.target.value || null })} />
        </div>
        <div className="bg-surface-white border border-border rounded-xl p-4">
          <Label className="text-xs text-muted-foreground">Terms (visible on PDF)</Label>
          <Textarea defaultValue={invoice.terms || ""} rows={3} onBlur={(e) => update({ terms: e.target.value || null })} />
        </div>
      </div>

      {payments && payments.length > 0 && (
        <div className="bg-surface-white border border-border rounded-xl p-3 mt-4">
          <h3 className="font-semibold text-sm px-2 mb-2">Payments</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Method</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {payments.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs">{p.payment_date}</TableCell>
                  <TableCell className="capitalize text-xs">{p.method.replace("_", " ")}</TableCell>
                  <TableCell className="text-xs font-mono">{p.reference_no || "—"}</TableCell>
                  <TableCell className="text-right font-mono">{fmtINR(p.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Amount (₹)</Label><Input type="number" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></div>
              <div><Label>Date</Label><Input type="date" value={pay.payment_date} onChange={(e) => setPay({ ...pay, payment_date: e.target.value })} /></div>
            </div>
            <div>
              <Label>Method</Label>
              <Select value={pay.method} onValueChange={(v) => setPay({ ...pay, method: v })}>
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
            <div><Label>Reference number</Label><Input value={pay.reference_no} onChange={(e) => setPay({ ...pay, reference_no: e.target.value })} /></div>
            <div><Label>Notes</Label><Textarea value={pay.notes} onChange={(e) => setPay({ ...pay, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={recordPayment}>Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, bold, accent }: any) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold text-base" : ""}`}>
      <span>{label}</span>
      <span className={`font-mono ${accent || ""}`}>{value}</span>
    </div>
  );
}