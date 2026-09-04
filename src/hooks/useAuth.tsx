import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type UserRole = "admin" | "team" | null;

export const ALL_MODULES = ["crm", "tasks", "customers", "billing", "content", "seo", "settings", "team", "tracking"] as const;
export type ModuleKey = typeof ALL_MODULES[number];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isTeam: boolean;
  role: UserRole;
  permissions: string[];
  hasModule: (m: ModuleKey) => boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const checkRole = async (userId: string): Promise<UserRole> => {
    // Check admin first
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (isAdmin) return "admin";

    const { data: isTeam } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "team" as any,
    });
    if (isTeam) return "team";

    return null;
  };

  useEffect(() => {
    let isMounted = true;

    const syncAuthState = async (nextSession: Session | null) => {
      if (!isMounted) return;
      setLoading(true);
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        setRole(null);
        setPermissions([]);
        setLoading(false);
        return;
      }

      const userRole = await checkRole(nextUser.id);
      if (!isMounted) return;
      setRole(userRole);
      const { data: perms } = await supabase
        .from("user_permissions")
        .select("module")
        .eq("user_id", nextUser.id);
      if (!isMounted) return;
      setPermissions((perms || []).map((p: any) => p.module));
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncAuthState(nextSession);
    });

    void supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
      void syncAuthState(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setPermissions([]);
  };

  return (
    <AuthContext.Provider value={{
      user, session,
      isAdmin: role === "admin",
      isTeam: role === "team",
      role, permissions,
      hasModule: (m) => role === "admin" || permissions.includes(m),
      loading, signIn, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
