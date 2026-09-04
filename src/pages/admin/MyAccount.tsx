import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { KeyRound, User as UserIcon, Shield, Mail } from "lucide-react";
import { LogOut } from "lucide-react";
import { NotificationSettings } from "@/components/admin/NotificationSettings";

export default function MyAccount() {
  const { user, role, permissions } = useAuth();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);

  const signOutAllDevices = async () => {
    setSigningOutAll(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      toast.success("Signed out of all devices");
      window.location.href = "/admin/login";
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out of all devices");
    } finally {
      setSigningOutAll(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 6) return toast.error("New password must be at least 6 characters");
    if (newPw !== confirmPw) return toast.error("Passwords do not match");
    if (!user?.email) return toast.error("Missing email on session");

    setSaving(true);
    try {
      // Re-authenticate to verify the current password
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPw,
      });
      if (signInErr) throw new Error("Current password is incorrect");

      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;

      // Sign out all other sessions so a rotated password invalidates them everywhere
      try {
        await supabase.auth.signOut({ scope: "others" });
      } catch {
        // non-fatal
      }

      toast.success("Password updated. Other devices have been signed out.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-display font-bold text-lead mb-1">My Account</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage your profile and password</p>

      <div className="bg-surface-white rounded-xl border border-border p-6 mb-6">
        <h2 className="font-display font-semibold text-lead mb-4 flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-primary" /> Profile
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
            <Input value={user?.email || ""} disabled className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> Role</Label>
            <Input value={role || "—"} disabled className="mt-1 capitalize" />
          </div>
        </div>
        {role === "team" && (
          <div className="mt-4">
            <Label className="text-xs text-muted-foreground">Module Access</Label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {permissions.length === 0 && <span className="text-sm text-muted-foreground">No modules assigned</span>}
              {permissions.map((p) => (
                <span key={p} className="text-xs px-2 py-1 rounded-md bg-muted capitalize">{p}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={changePassword} className="bg-surface-white rounded-xl border border-border p-6">
        <h2 className="font-display font-semibold text-lead mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" /> Change Password
        </h2>
        <div className="grid gap-4 sm:max-w-md">
          <div>
            <Label htmlFor="cur-pw">Current Password</Label>
            <PasswordInput id="cur-pw" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="new-pw">New Password</Label>
            <PasswordInput id="new-pw" value={newPw} onChange={(e) => setNewPw(e.target.value)} required placeholder="Min 6 characters" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="conf-pw">Confirm New Password</Label>
            <PasswordInput id="conf-pw" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required className="mt-1" />
          </div>
          <Button type="submit" disabled={saving} className="w-fit">
            {saving ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </form>

      <div className="mt-6 bg-surface-white rounded-xl border border-border p-6">
        <h2 className="font-display font-semibold text-lead mb-2 flex items-center gap-2">
          <LogOut className="h-5 w-5 text-primary" /> Active Sessions
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Sign out everywhere you're logged in — this device and any other browser, phone, or tablet.
        </p>
        <Button variant="destructive" onClick={signOutAllDevices} disabled={signingOutAll}>
          {signingOutAll ? "Signing out..." : "Sign out of all devices"}
        </Button>
      </div>

      <div className="mt-6">
        <NotificationSettings />
      </div>
    </div>
  );
}