import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchPrimaryRole, logAudit, type AppRole } from "@/lib/roles";
import { hasModuleAccess, type Module } from "@/lib/permissions";

const IMPERSONATION_KEY = "ac_impersonating";
const IMPERSONATION_SESSION_KEY = "ac_impersonation_session";

interface RoleContextValue {
  role: AppRole;
  realRole: AppRole;
  userId: string;
  realUserId: string;
  email: string;
  isImpersonating: boolean;
  impersonationName: string;
  can: (module: Module) => boolean;
  startImpersonation: (
    targetId: string,
    targetEmail: string,
    targetName: string,
  ) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  loading: boolean;
}

const RoleContext = createContext<RoleContextValue>({
  role: "customer",
  realRole: "customer",
  userId: "",
  realUserId: "",
  email: "",
  isImpersonating: false,
  impersonationName: "",
  can: () => false,
  startImpersonation: async () => {},
  stopImpersonation: async () => {},
  loading: true,
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [realRole, setRealRole] = useState<AppRole>("customer");
  const [role, setRole] = useState<AppRole>("customer");
  const [realUserId, setRealUserId] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonationName, setImpersonationName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }

    const rid = u.user.id;
    const remail = u.user.email ?? "";
    setRealUserId(rid);
    setEmail(remail);

    const rr = await fetchPrimaryRole(rid);
    setRealRole(rr);

    // Check impersonation
    const stored = typeof window !== "undefined"
      ? localStorage.getItem(IMPERSONATION_KEY)
      : null;
    if (stored && (rr === "owner" || rr === "admin")) {
      const parsed = JSON.parse(stored) as {
        targetId: string;
        targetEmail: string;
        targetName: string;
      };
      const impRole = await fetchPrimaryRole(parsed.targetId);
      setRole(impRole);
      setUserId(parsed.targetId);
      setIsImpersonating(true);
      setImpersonationName(parsed.targetName);
    } else {
      setRole(rr);
      setUserId(rid);
    }
    setLoading(false);
  }

  const can = (module: Module) => hasModuleAccess(role, module);

  async function startImpersonation(
    targetId: string,
    targetEmail: string,
    targetName: string,
  ) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;

    // Log to impersonation_log
    const { data: logRow } = await supabase
      .from("impersonation_log" as never)
      .insert({
        impersonator_id: u.user.id,
        target_user_id: targetId,
      })
      .select("id")
      .single();

    localStorage.setItem(IMPERSONATION_KEY, JSON.stringify({ targetId, targetEmail, targetName }));
    if (logRow) {
      localStorage.setItem(IMPERSONATION_SESSION_KEY, (logRow as { id: string }).id);
    }

    await logAudit({
      actorId: u.user.id,
      actorEmail: u.user.email ?? "",
      action: "impersonation_start",
      targetType: "user",
      targetId,
      targetEmail,
      metadata: { targetName },
    });

    const impRole = await fetchPrimaryRole(targetId);
    setRole(impRole);
    setUserId(targetId);
    setIsImpersonating(true);
    setImpersonationName(targetName);
  }

  async function stopImpersonation() {
    const { data: u } = await supabase.auth.getUser();

    // End impersonation log record
    const sessionId = localStorage.getItem(IMPERSONATION_SESSION_KEY);
    if (sessionId) {
      await supabase
        .from("impersonation_log" as never)
        .update({ ended_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    localStorage.removeItem(IMPERSONATION_KEY);
    localStorage.removeItem(IMPERSONATION_SESSION_KEY);

    if (u.user) {
      await logAudit({
        actorId: u.user.id,
        actorEmail: u.user.email ?? "",
        action: "impersonation_stop",
      });
    }

    setRole(realRole);
    setUserId(realUserId);
    setIsImpersonating(false);
    setImpersonationName("");
  }

  return (
    <RoleContext.Provider
      value={{
        role,
        realRole,
        userId,
        realUserId,
        email,
        isImpersonating,
        impersonationName,
        can,
        startImpersonation,
        stopImpersonation,
        loading,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
