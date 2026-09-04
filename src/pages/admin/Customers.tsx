import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCustomers } from "@/hooks/useCustomers";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Building2, Mail, Phone, Search } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-amber-100 text-amber-800",
  churned: "bg-red-100 text-red-800",
  prospect: "bg-blue-100 text-blue-800",
};

export default function Customers() {
  const { hasModule, user } = useAuth();
  const qc = useQueryClient();
  const { data: customers, isLoading } = useCustomers();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    company_name: "", contact_name: "", email: "", phone: "", website: "",
    monthly_retainer: "", monthly_ad_budget: "", status: "active",
  });
  const [saving, setSaving] = useState(false);

  if (!hasModule("customers")) return <div className="text-center py-12 text-muted-foreground">No access to Customers module</div>;

  const create = async () => {
    if (!form.company_name.trim()) return toast.error("Company name required");
    setSaving(true);
    const { error } = await supabase.from("customers").insert({
      company_name: form.company_name.trim(),
      contact_name: form.contact_name || null,
      email: form.email || null,
      phone: form.phone || null,
      website: form.website || null,
      monthly_retainer: Number(form.monthly_retainer) || 0,
      monthly_ad_budget: Number(form.monthly_ad_budget) || 0,
      status: form.status as any,
      created_by: user?.id,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Customer added");
    setOpen(false);
    setForm({ company_name: "", contact_name: "", email: "", phone: "", website: "", monthly_retainer: "", monthly_ad_budget: "", status: "active" });
    qc.invalidateQueries({ queryKey: ["customers"] });
  };

  const filtered = (customers || []).filter((c: any) =>
    !search || c.company_name.toLowerCase().includes(search.toLowerCase()) || (c.contact_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-lead mb-1">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage active accounts, billing & team allocations</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> New Customer</Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="bg-surface-white rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Monthly Retainer</TableHead>
              <TableHead className="text-right">Ad Budget</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No customers yet</TableCell></TableRow>
            )}
            {filtered.map((c: any) => (
              <TableRow key={c.id} className="hover:bg-muted/30">
                <TableCell>
                  <Link to={`/admin/customers/${c.id}`} className="font-semibold text-lead hover:text-primary flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" /> {c.company_name}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div>{c.contact_name || "—"}</div>
                  <div className="flex gap-3 text-xs mt-0.5">
                    {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                    {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${STATUS_COLORS[c.status]} capitalize border-0`}>{c.status}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">₹{Number(c.monthly_retainer || 0).toLocaleString("en-IN")}</TableCell>
                <TableCell className="text-right font-mono text-sm">₹{Number(c.monthly_ad_budget || 0).toLocaleString("en-IN")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Customer</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Company name *</Label><Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Contact name</Label><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="churned">Churned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Monthly retainer (₹)</Label><Input type="number" value={form.monthly_retainer} onChange={(e) => setForm({ ...form, monthly_retainer: e.target.value })} /></div>
              <div><Label>Monthly ad budget (₹)</Label><Input type="number" value={form.monthly_ad_budget} onChange={(e) => setForm({ ...form, monthly_ad_budget: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={saving}>{saving ? "Saving..." : "Create Customer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}