import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchPrimaryRole, logAudit, type AppRole } from "@/lib/roles";
import {
  hasModuleAccess,
  getDefaultModules,
  type Module,
} from "@/lib/permissions";

const IMPERSONATION_KEY = "ac_impersonating";
const IMPERSONATION_SESSION_KEY = "ac_impersonation_session";

// DB permission override: role → module → allowed
type PermissionOverrides = Partial<Record<Module, boolean>>;

interface RoleContextValue {
  role: AppRole;
  realRole: AppRole;
  userId: string;
  realUserId: string;
  email: string;
  isImpersonating: boolean;
  impersonationName: string;
  permissionOverrides: PermissionOverrides;
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
  permissionOverrides: {},
  can: () => false,
  startImpersonation: async () => {},
  stopImpersonation: async () => {},
  loading: true,
});

async function loadDbPermissions(role: AppRole): Promise<PermissionOverrides> {
  if (role === "owner" || role === "admin") return {};
  const { data } = await supabase
    .from("role_permissions" as never)
    .select("module, allowed")
    .eq("role", role) as {
    data: Array<{ module: string; allowed: boolean }> | null;
  };
  const overrides: PermissionOverrides = {};
  (data ?? []).forEach(({ module, allowed }) => {
    overrides[module as Module] = allowed;
  });
  return overrides;
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [realRole, setRealRole] = useState<AppRole>("customer");
  const [role, setRole] = useState<AppRole>("customer");
  const [realUserId, setRealUserId] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonationName, setImpersonationName] = useState("");
  const [permissionOverrides, setPermissionOverrides] =
    useState<PermissionOverrides>({});
  const [loading, setLoading] = useState(true);
  const sessionIdRef = useRef<string | null>(null);
  const touchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    init();
    return () => {
      if (touchTimerRef.current) clearInterval(touchTimerRef.current);
    };
  }, []);

  async function init() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setLoading(false);
      return;
    }

    const rid = u.user.id;
    const remail = u.user.email ?? "";
    setRealUserId(rid);
    setEmail(remail);

    const rr = await fetchPrimaryRole(rid);
    setRealRole(rr);

    // Record login session (non-blocking)
    recordSession();

    // Load DB permissions for this role
    const overrides = await loadDbPermissions(rr);

    // Check impersonation — only the owner role may impersonate
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem(IMPERSONATION_KEY)
        : null;
    if (stored && rr === "owner") {
      const parsed = JSON.parse(stored) as {
        targetId: string;
        targetEmail: string;
        targetName: string;
      };
      const impRole = await fetchPrimaryRole(parsed.targetId);
      const impOverrides = await loadDbPermissions(impRole);
      setRole(impRole);
      setUserId(parsed.targetId);
      setIsImpersonating(true);
      setImpersonationName(parsed.targetName);
      setPermissionOverrides(impOverrides);
    } else {
      setRole(rr);
      setUserId(rid);
      setPermissionOverrides(overrides);
    }
    setLoading(false);
  }

  async function recordSession() {
    const ua = navigator.userAgent;
    const device = /mobile/i.test(ua) ? "mobile" : "desktop";
    const { data } = await supabase.rpc("record_user_session" as never, {
      _user_agent: ua,
      _device_type: device,
    } as never) as { data: string | null };
    if (data) {
      sessionIdRef.current = data;
      // Touch every 5 minutes to update last_seen
      touchTimerRef.current = setInterval(async () => {
        if (sessionIdRef.current) {
          await supabase.rpc("touch_session" as never, {
            _session_id: sessionIdRef.current,
          } as never);
        }
      }, 5 * 60 * 1000);
    }
  }

  // can() uses DB overrides first, then defaults; owner/admin always true
  const can = (module: Module): boolean => {
    const effectiveRole = role;
    if (effectiveRole === "owner" || effectiveRole === "admin") return true;
    if (module in permissionOverrides)
      return permissionOverrides[module] as boolean;
    return hasModuleAccess(effectiveRole, module);
  };

  async function startImpersonation(
    targetId: string,
    targetEmail: string,
    targetName: string,
  ) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;

    const { data: logRow } = await supabase
      .from("impersonation_log" as never)
      .insert({
        impersonator_id: u.user.id,
        target_user_id: targetId,
      })
      .select("id")
      .single();

    localStorage.setItem(
      IMPERSONATION_KEY,
      JSON.stringify({ targetId, targetEmail, targetName }),
    );
    if (logRow) {
      localStorage.setItem(
        IMPERSONATION_SESSION_KEY,
        (logRow as { id: string }).id,
      );
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
    const impOverrides = await loadDbPermissions(impRole);
    setRole(impRole);
    setUserId(targetId);
    setIsImpersonating(true);
    setImpersonationName(targetName);
    setPermissionOverrides(impOverrides);
  }

  async function stopImpersonation() {
    const { data: u } = await supabase.auth.getUser();
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

    // Restore real role + real permissions
    const realOverrides = await loadDbPermissions(realRole);
    setRole(realRole);
    setUserId(realUserId);
    setIsImpersonating(false);
    setImpersonationName("");
    setPermissionOverrides(realOverrides);
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
        permissionOverrides,
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
