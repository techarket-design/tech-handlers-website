import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { useUpsertRow, syncLeadAssignees } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import MultiAssigneeSelect from "@/components/admin/MultiAssigneeSelect";
import { useDraftPersistence } from "@/hooks/useDraftPersistence";
import { usePersistentState } from "@/hooks/usePersistentState";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, UserPlus } from "lucide-react";

const leadLabels = [
  "Hot Lead", "Low Budget", "Follow-up", "Decision Maker",
  "Needs Proposal", "Not Interested", "Competitor", "Referral", "Inbound", "Outbound",
];

const sourceOptions = ["website", "referral", "linkedin", "cold_call", "email_campaign", "social_media", "event", "other"];

const defaultLeadForm = {
  name: "", email: "", phone: "", company: "", designation: "",
  website_url: "", budget: "", requirement: "", message: "",
  service_interest: "", source: "website", priority: "warm",
  lead_label: "",
};

interface AddLeadFormProps {
  trigger?: ReactNode;
}

export default function AddLeadForm({ trigger }: AddLeadFormProps) {
  const upsert = useUpsertRow("leads");
  const { user } = useAuth();
  const [assignees, setAssignees] = useState<string[]>([]);
  const [open, setOpen, clearOpenState] = usePersistentState(
    "crm_dialog_add_lead_open",
    false
  );
  const { form, update, clearDraft, hasDraft } = useDraftPersistence("add_lead", defaultLeadForm);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");

    try {
      const lead = await upsert.mutateAsync({
        name: form.name.trim(),
        email: form.email || null,
        phone: form.phone || null,
        company: form.company || null,
        designation: form.designation || null,
        website_url: form.website_url || null,
        budget: form.budget || null,
        requirement: form.requirement || null,
        message: form.message || null,
        service_interest: form.service_interest || null,
        source: form.source || "website",
        priority: form.priority || "warm",
        lead_label: form.lead_label || null,
        assigned_to: assignees[0] || null,
        status: "new",
        created_by: user?.id || null,
      } as any);
      const leadId = (lead as any)?.id;
      if (leadId && assignees.length) {
        await syncLeadAssignees(leadId, assignees);
      }

      toast.success("Lead added successfully!");
      setAssignees([]);
      clearDraft();
      clearOpenState();
    } catch (err: any) {
      toast.error(err.message || "Failed to add lead");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Add New Lead
          </DialogTitle>
        </DialogHeader>
        {hasDraft && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded px-3 py-1.5 flex items-center justify-between">
            <span>📝 Draft restored from your previous session</span>
            <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={clearDraft}>Clear</Button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" value={form.name} onChange={e => update("name", e.target.value)} required placeholder="John Doe" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="designation">Designation / Role</Label>
              <Input id="designation" value={form.designation} onChange={e => update("designation", e.target.value)} placeholder="Marketing Head" className="mt-1" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="john@company.com" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+91 98765 43210" className="mt-1" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" value={form.company} onChange={e => update("company", e.target.value)} placeholder="Acme Corp" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={form.website_url} onChange={e => update("website_url", e.target.value)} placeholder="https://example.com" className="mt-1" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Budget Range</Label>
              <Select value={form.budget} onValueChange={v => update("budget", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select budget" /></SelectTrigger>
                <SelectContent>
                  {["Under ₹25K", "₹25K - ₹50K", "₹50K - ₹1L", "₹1L - ₹3L", "₹3L - ₹5L", "₹5L+", "Not Disclosed"].map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Source</Label>
              <Select value={form.source} onValueChange={v => update("source", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sourceOptions.map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lead Label</Label>
              <Select value={form.lead_label} onValueChange={v => update("lead_label", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select label" /></SelectTrigger>
                <SelectContent>
                  {leadLabels.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="service_interest">Service Interest</Label>
            <Select value={form.service_interest} onValueChange={v => update("service_interest", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="What are they looking for?" /></SelectTrigger>
              <SelectContent>
                {["Digital Marketing", "Performance Marketing", "SEO", "Social Media Marketing", "Web Development", "LinkedIn Automation", "Full Suite", "Other"].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="requirement">Requirement Details</Label>
            <Textarea id="requirement" value={form.requirement} onChange={e => update("requirement", e.target.value)} placeholder="Describe what the client needs in detail..." rows={3} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="message">Additional Notes</Label>
            <Textarea id="message" value={form.message} onChange={e => update("message", e.target.value)} placeholder="Any extra context..." rows={2} className="mt-1" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => update("priority", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot">🔥 Hot</SelectItem>
                  <SelectItem value="warm">🌡️ Warm</SelectItem>
                  <SelectItem value="cold">❄️ Cold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assigned To</Label>
              <div className="mt-1">
                <MultiAssigneeSelect value={assignees} onChange={setAssignees} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={upsert.isPending}>
              {upsert.isPending ? "Saving..." : "Add Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
