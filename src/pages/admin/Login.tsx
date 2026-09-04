import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, LogIn } from "lucide-react";
import { toast } from "sonner";
import logoImg from "@/assets/logo.png";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawNext = params.get("next") ?? "";
  // Only allow same-origin relative paths to prevent open-redirect.
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error("Invalid credentials");
    } else {
      if (next) {
        window.location.href = next;
      } else {
        navigate("/admin");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={logoImg} alt="Tech Handlers" className="h-10 w-auto" />
          <span className="font-display text-xl font-bold text-lead">Tech Handlers</span>
        </div>

        <div className="bg-surface-white rounded-2xl border border-border p-6 shadow-sm">
          <h1 className="font-display text-lg font-bold text-lead mb-1">Team Login</h1>
          <p className="text-sm text-muted-foreground mb-6">Sign in to access admin panel & CRM</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1" />
            </div>
            <Button type="submit" className="w-full gradient-primary-accent text-primary-foreground" disabled={loading}>
              <LogIn className="mr-2 h-4 w-4" /> {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Contact your admin to get team access credentials
        </p>
      </div>
    </div>
  );
}
