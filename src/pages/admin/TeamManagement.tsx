import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ALL_MODULES, type ModuleKey } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTeamMembers } from "@/hooks/useData";
import { UserPlus, Trash2, Shield, Users, KeyRound, Lock } from "lucide-react";

const MODULE_LABELS: Record<ModuleKey, string> = {
  crm: "CRM (Leads, Pipeline, Reminders)",
  tasks: "Tasks (Projects & Team Tasks)",
  customers: "Customers (Accounts & Team Allocations)",
  billing: "Billing (Invoices, Payments, Reports)",
  content: "Content (Blog, File Manager)",
  seo: "SEO",
  settings: "Site Settings (Nav, Footer, Settings)",
  team: "Team Management",
  tracking: "Tracking Scripts",
};

export default function TeamManagement() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("team");
  const [permissions, setPermissions] = useState<ModuleKey[]>([]);
  const [creating, setCreating] = useState(false);

  // Change password state
  const [pwDialog, setPwDialog] = useState<{ open: boolean; userId: string; userLabel: string }>({ open: false, userId: "", userLabel: "" });
  const [newPw, setNewPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  // Permissions edit dialog
  const [permDialog, setPermDialog] = useState<{ open: boolean; userId: string; label: string }>({ open: false, userId: "", label: "" });
  const [editPerms, setEditPerms] = useState<ModuleKey[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  const { data: teamMembers, isLoading } = useTeamMembers();

  // Keep user_roles for deletion
  const { data: userRoles } = useQuery({
    queryKey: ["user_roles_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allPermissions } = useQuery({
    queryKey: ["user_permissions_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_permissions").select("*");
      if (error) throw error;
      return data as { id: string; user_id: string; module: string }[];
    },
  });

  const createTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Email and password required");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");

    setCreating(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("admin-create-user", {
        body: { email, password, role, permissions: role === "team" ? permissions : [] },
      });
      if (fnError) {
        // Extract real error message from edge function response body
        let realMsg = fnError.message;
        try {
          const ctx: any = (fnError as any).context;
          if (ctx?.json) {
            const j = await ctx.json();
            if (j?.error) realMsg = j.error;
          } else if (ctx?.body) {
            const txt = typeof ctx.body === "string" ? ctx.body : await new Response(ctx.body).text();
            try { const j = JSON.parse(txt); if (j?.error) realMsg = j.error; } catch { realMsg = txt || realMsg; }
          }
        } catch {}
        throw new Error(realMsg);
      }
      if (fnData?.error) throw new Error(fnData.error);
      if (!fnData?.user_id) throw new Error("Failed to create user");

      toast.success(`Team member ${email} created with ${role} role`);
      setEmail("");
      setPassword("");
      setPermissions([]);
      qc.invalidateQueries({ queryKey: ["user_roles_all"] });
      qc.invalidateQueries({ queryKey: ["user_permissions_all"] });
      qc.invalidateQueries({ queryKey: ["team_members"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to create team member");
    } finally {
      setCreating(false);
    }
  };

  const removeRole = async (userId: string) => {
    const roleRecord = userRoles?.find(ur => ur.user_id === userId);
    if (!roleRecord) return toast.error("Role record not found");
    const { error } = await supabase.from("user_roles").delete().eq("id", roleRecord.id);
    if (error) {
      toast.error("Failed to remove role");
    } else {
      toast.success("Role removed");
      qc.invalidateQueries({ queryKey: ["user_roles_all"] });
      qc.invalidateQueries({ queryKey: ["team_members"] });
    }
  };

  const openPermDialog = (userId: string, label: string) => {
    const existing = (allPermissions || []).filter(p => p.user_id === userId).map(p => p.module as ModuleKey);
    setEditPerms(existing);
    setPermDialog({ open: true, userId, label });
  };

  const savePermissions = async () => {
    setSavingPerms(true);
    try {
      const { error: delErr } = await supabase.from("user_permissions").delete().eq("user_id", permDialog.userId);
      if (delErr) throw delErr;
      if (editPerms.length > 0) {
        const { error: insErr } = await supabase.from("user_permissions").insert(
          editPerms.map((module) => ({ user_id: permDialog.userId, module }))
        );
        if (insErr) throw insErr;
      }
      toast.success("Permissions updated");
      setPermDialog({ open: false, userId: "", label: "" });
      qc.invalidateQueries({ queryKey: ["user_permissions_all"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save permissions");
    } finally {
      setSavingPerms(false);
    }
  };

  const changePassword = async () => {
    if (!newPw || newPw.length < 6) return toast.error("Password must be at least 6 characters");
    setChangingPw(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-change-password", {
        body: { user_id: pwDialog.userId, new_password: newPw },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Password updated successfully");
      setPwDialog({ open: false, userId: "", userLabel: "" });
      setNewPw("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setChangingPw(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Only admins can manage team members</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-lead mb-1">Team Management</h1>
      <p className="text-sm text-muted-foreground mb-6">Add team members and manage access roles</p>

      {/* Add new member */}
      <div className="bg-surface-white rounded-xl border border-border p-6 mb-6">
        <h2 className="font-display font-semibold text-lead mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" /> Add Team Member
        </h2>
        <form onSubmit={createTeamMember} className="space-y-4">
          <div className="grid sm:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="member-email">Email</Label>
            <Input id="member-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="team@company.com" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="member-password">Password</Label>
            <PasswordInput id="member-password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" className="mt-1" />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="team">Team Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={creating}>
            <UserPlus className="mr-2 h-4 w-4" />
            {creating ? "Creating..." : "Add Member"}
          </Button>
          </div>
          {role === "team" && (
            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <Label className="text-sm font-semibold mb-2 block">Module Access</Label>
              <p className="text-xs text-muted-foreground mb-3">Select which sections this team member can access. Admins have access to everything by default.</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {ALL_MODULES.map((m) => (
                  <label key={m} className="flex items-start gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={permissions.includes(m)}
                      onCheckedChange={(checked) => {
                        setPermissions(prev => checked ? [...prev, m] : prev.filter(p => p !== m));
                      }}
                    />
                    <span>{MODULE_LABELS[m]}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </form>
        <p className="text-xs text-muted-foreground mt-3">
          Team members can access CRM (pipeline, leads, activities). Admins can also manage content and settings.
        </p>
      </div>

      {/* Existing roles */}
      <div className="bg-surface-white rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-display font-semibold text-lead flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Current Team ({teamMembers?.length || 0})
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-72 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8"><div className="animate-pulse h-4 bg-muted rounded w-32 mx-auto" /></TableCell></TableRow>
            ) : teamMembers?.map((tm) => (
              <TableRow key={tm.user_id}>
                <TableCell className="font-medium text-lead">{tm.name || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{tm.email}</TableCell>
                <TableCell>
                  <Select
                    value={tm.role}
                    onValueChange={async (newRole) => {
                      if (newRole === tm.role) return;
                      const rec = userRoles?.find((ur) => ur.user_id === tm.user_id);
                      if (!rec) return toast.error("Role record not found");
                      const { error } = await supabase
                        .from("user_roles")
                        .update({ role: newRole as any })
                        .eq("id", rec.id);
                      if (error) return toast.error(error.message || "Failed to change role");
                      toast.success(`Role updated to ${newRole}`);
                      qc.invalidateQueries({ queryKey: ["user_roles_all"] });
                      qc.invalidateQueries({ queryKey: ["team_members"] });
                    }}
                  >
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <span className="inline-flex items-center gap-1"><Shield className="h-3 w-3" /> Admin</span>
                      </SelectItem>
                      <SelectItem value="team">
                        <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> Team</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {tm.role !== "admin" && (
                    <Button size="sm" variant="ghost" onClick={() => openPermDialog(tm.user_id, tm.name || tm.email)}>
                      <Lock className="h-4 w-4 mr-1" /> Permissions
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setPwDialog({ open: true, userId: tm.user_id, userLabel: tm.name || tm.email })}>
                    <KeyRound className="h-4 w-4 mr-1" /> Password
                  </Button>
                  <Button size="icon" variant="ghost" title="Remove role" className="text-destructive hover:text-destructive" onClick={() => removeRole(tm.user_id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && !teamMembers?.length && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No team members yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={pwDialog.open} onOpenChange={(open) => { setPwDialog((p) => ({ ...p, open })); setNewPw(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Change Password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Set a new password for user <span className="font-mono font-semibold">{pwDialog.userLabel}...</span></p>
          <div className="mt-2">
            <Label htmlFor="new-pw">New Password</Label>
            <PasswordInput id="new-pw" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min 6 characters" className="mt-1" />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setPwDialog({ open: false, userId: "", userLabel: "" })}>Cancel</Button>
            <Button onClick={changePassword} disabled={changingPw}>{changingPw ? "Updating..." : "Update Password"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permDialog.open} onOpenChange={(open) => setPermDialog((p) => ({ ...p, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Module Access</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Manage access for user <span className="font-mono font-semibold">{permDialog.label}...</span></p>
          <div className="space-y-2 mt-2">
            {ALL_MODULES.map((m) => (
              <label key={m} className="flex items-start gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={editPerms.includes(m)}
                  onCheckedChange={(checked) => {
                    setEditPerms(prev => checked ? [...prev, m] : prev.filter(p => p !== m));
                  }}
                />
                <span>{MODULE_LABELS[m]}</span>
              </label>
            ))}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setPermDialog({ open: false, userId: "", label: "" })}>Cancel</Button>
            <Button onClick={savePermissions} disabled={savingPerms}>{savingPerms ? "Saving..." : "Save Permissions"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
