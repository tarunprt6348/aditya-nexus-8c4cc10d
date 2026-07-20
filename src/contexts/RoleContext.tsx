import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { getStoredToken } from "@/integrations/auth/client";
import { getPrimaryRole, logAudit, type AppRole } from "@/lib/roles";
import { hasModuleAccess, getDefaultModules, type Module } from "@/lib/permissions";
import {
  getUserRoles,
  getRolePermissions,
  recordSession,
  touchSession,
  startImpersonationLog,
  endImpersonationLog,
} from "@/lib/data.functions";
import { getMe } from "@/lib/auth.functions";

const IMPERSONATION_KEY = "ac_impersonating";
const IMPERSONATION_SESSION_KEY = "ac_impersonation_session";

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
  startImpersonation: (targetId: string, targetEmail: string, targetName: string) => Promise<void>;
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
  try {
    const all = await getRolePermissions();
    const overrides: PermissionOverrides = {};
    (all ?? [])
      .filter(p => p.role === role)
      .forEach(({ module, allowed }) => {
        overrides[module as Module] = allowed;
      });
    return overrides;
  } catch {
    return {};
  }
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [realRole, setRealRole] = useState<AppRole>("customer");
  const [role, setRole] = useState<AppRole>("customer");
  const [realUserId, setRealUserId] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonationName, setImpersonationName] = useState("");
  const [permissionOverrides, setPermissionOverrides] = useState<PermissionOverrides>({});
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
    if (!getStoredToken()) {
      setLoading(false);
      return;
    }

    try {
      const me = await getMe();
      if (!me) {
        setLoading(false);
        return;
      }

      const rid = me.id;
      const remail = me.email ?? "";
      setRealUserId(rid);
      setEmail(remail);

      const roles = me.roles as AppRole[];
      const rr = getPrimaryRole(roles);
      setRealRole(rr);

      // Record login session (non-blocking)
      doRecordSession();

      // Load DB permissions for this role
      const overrides = await loadDbPermissions(rr);

      // Check impersonation — only owner may impersonate
      const stored = typeof window !== "undefined"
        ? localStorage.getItem(IMPERSONATION_KEY)
        : null;

      if (stored && rr === "owner") {
        const parsed = JSON.parse(stored) as { targetId: string; targetEmail: string; targetName: string };
        const targetRoles = await getUserRoles({ data: { userId: parsed.targetId } });
        const impRole = getPrimaryRole(targetRoles);
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
    } catch {
      // Token may be invalid — clear it
      const { clearSession } = await import("@/integrations/auth/client");
      clearSession();
    }
    setLoading(false);
  }

  async function doRecordSession() {
    try {
      const ua = navigator.userAgent;
      const device = /mobile/i.test(ua) ? "mobile" : "desktop";
      const sid = await recordSession({ data: { userAgent: ua, deviceType: device } });
      if (sid) {
        sessionIdRef.current = sid;
        touchTimerRef.current = setInterval(async () => {
          if (sessionIdRef.current) {
            await touchSession({ data: { sessionId: sessionIdRef.current } });
          }
        }, 5 * 60 * 1000);
      }
    } catch {
      // Non-blocking
    }
  }

  const can = (module: Module): boolean => {
    const effectiveRole = role;
    if (effectiveRole === "owner" || effectiveRole === "admin") return true;
    if (module in permissionOverrides) return permissionOverrides[module] as boolean;
    return hasModuleAccess(effectiveRole, module);
  };

  async function startImpersonation(targetId: string, targetEmail: string, targetName: string) {
    const me = await getMe();
    if (!me) return;

    const { data: logRow } = await startImpersonationLog({
      data: { impersonatorId: me.id, targetUserId: targetId },
    }).then(r => ({ data: r })).catch(() => ({ data: null }));

    localStorage.setItem(IMPERSONATION_KEY, JSON.stringify({ targetId, targetEmail, targetName }));
    if (logRow?.id) {
      localStorage.setItem(IMPERSONATION_SESSION_KEY, logRow.id);
    }

    await logAudit({
      actorId: me.id,
      actorEmail: me.email ?? "",
      action: "impersonation_start",
      targetType: "user",
      targetId,
      targetEmail,
      metadata: { targetName },
    });

    const targetRoles = await getUserRoles({ data: { userId: targetId } });
    const impRole = getPrimaryRole(targetRoles);
    const impOverrides = await loadDbPermissions(impRole);
    setRole(impRole);
    setUserId(targetId);
    setIsImpersonating(true);
    setImpersonationName(targetName);
    setPermissionOverrides(impOverrides);
  }

  async function stopImpersonation() {
    const sessionId = localStorage.getItem(IMPERSONATION_SESSION_KEY);
    if (sessionId) {
      await endImpersonationLog({ data: { id: sessionId } }).catch(() => {});
    }
    localStorage.removeItem(IMPERSONATION_KEY);
    localStorage.removeItem(IMPERSONATION_SESSION_KEY);

    const me = await getMe();
    if (me) {
      await logAudit({ actorId: me.id, actorEmail: me.email ?? "", action: "impersonation_stop" });
    }

    const realOverrides = await loadDbPermissions(realRole);
    setRole(realRole);
    setUserId(realUserId);
    setIsImpersonating(false);
    setImpersonationName("");
    setPermissionOverrides(realOverrides);
  }

  return (
    <RoleContext.Provider value={{
      role, realRole, userId, realUserId, email, isImpersonating, impersonationName,
      permissionOverrides, can, startImpersonation, stopImpersonation, loading,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
