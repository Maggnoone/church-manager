import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logSafeError } from "@/lib/safe-error";

export type AppRole = "admin" | "catequista" | "tesorero" | "secretaria";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isTesorero: boolean;
  isCatequista: boolean;
  isSecretaria: boolean;
  canSeePagos: boolean;
  canRegisterPagos: boolean;
  canAccessPagosRetiro: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);
  const sessionVersionRef = useRef(0);
  const activeUserIdRef = useRef<string | null>(null);
  const roleLoadAttemptedVersionRef = useRef(0);

  const loadRoles = useCallback(
    async (
      userId: string,
      expectedSessionVersion?: number,
      isActive: () => boolean = () => mountedRef.current,
    ) => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);

        if (error) {
          logSafeError("[Auth] Failed to load user roles", error);
          if (
            isActive() &&
            mountedRef.current &&
            activeUserIdRef.current === userId &&
            (expectedSessionVersion === undefined ||
              sessionVersionRef.current === expectedSessionVersion)
          ) {
            setRoles([]);
          }
          return;
        }

        if (
          isActive() &&
          mountedRef.current &&
          activeUserIdRef.current === userId &&
          (expectedSessionVersion === undefined ||
            sessionVersionRef.current === expectedSessionVersion)
        ) {
          setRoles((data ?? []).map((r) => r.role as AppRole));
        }
      } catch (error) {
        logSafeError("[Auth] Failed to load user roles", error);
        if (
          isActive() &&
          mountedRef.current &&
          activeUserIdRef.current === userId &&
          (expectedSessionVersion === undefined ||
            sessionVersionRef.current === expectedSessionVersion)
        ) {
          setRoles([]);
        }
      }
    },
    [],
  );

  useEffect(() => {
    let active = true;
    let authEventCount = 0;
    let sawAuthEvent = false;
    let initializationSettled = false;
    let subscription: { unsubscribe: () => void } | undefined;
    const roleLoadTimeouts = new Set<ReturnType<typeof setTimeout>>();

    mountedRef.current = true;

    const applySession = (nextSession: Session | null) => {
      if (!active) return null;

      const sessionVersion = sessionVersionRef.current + 1;
      sessionVersionRef.current = sessionVersion;
      const nextUserId = nextSession?.user.id ?? null;
      const previousUserId = activeUserIdRef.current;
      activeUserIdRef.current = nextUserId;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user || previousUserId !== nextUserId) {
        setRoles([]);
      }

      return {
        sessionVersion,
        userId: nextUserId,
      };
    };

    const scheduleRoleLoad = (userId: string, sessionVersion: number) => {
      const timeoutId = setTimeout(() => {
        roleLoadTimeouts.delete(timeoutId);
        if (roleLoadAttemptedVersionRef.current >= sessionVersion) return;
        roleLoadAttemptedVersionRef.current = sessionVersion;
        void loadRoles(userId, sessionVersion, () => active);
      }, 0);
      roleLoadTimeouts.add(timeoutId);
    };

    const attemptRoleLoad = async (userId: string, sessionVersion: number) => {
      if (roleLoadAttemptedVersionRef.current >= sessionVersion) return;

      roleLoadAttemptedVersionRef.current = sessionVersion;
      await loadRoles(userId, sessionVersion, () => active);
    };

    const loadCurrentUserRoles = async () => {
      const currentUserId = activeUserIdRef.current;
      if (!currentUserId) return;

      const sessionVersion = sessionVersionRef.current;
      await attemptRoleLoad(currentUserId, sessionVersion);

      if (activeUserIdRef.current && sessionVersionRef.current !== sessionVersion) {
        await attemptRoleLoad(activeUserIdRef.current, sessionVersionRef.current);
      }
    };

    const handleAuthStateChange = (_event: string, newSession: Session | null) => {
      if (!active) return;

      sawAuthEvent = true;
      authEventCount += 1;
      const applied = applySession(newSession);
      if (applied?.userId && initializationSettled) {
        scheduleRoleLoad(applied.userId, applied.sessionVersion);
      }
    };

    const initialize = async () => {
      const eventCountAtStart = authEventCount;

      try {
        const {
          data: { session: existingSession },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;
        if (!active) return;

        if (!sawAuthEvent && authEventCount === eventCountAtStart) {
          applySession(existingSession);
        }

        await loadCurrentUserRoles();
      } catch (error) {
        if (active) {
          logSafeError("[Auth] Failed to restore session", error);

          if (!sawAuthEvent && authEventCount === eventCountAtStart) {
            applySession(null);
          }
          await loadCurrentUserRoles();
        }
      } finally {
        initializationSettled = true;
        if (active) {
          const currentUserId = activeUserIdRef.current;
          const currentSessionVersion = sessionVersionRef.current;

          if (
            currentUserId &&
            roleLoadAttemptedVersionRef.current < currentSessionVersion
          ) {
            scheduleRoleLoad(currentUserId, currentSessionVersion);
          }

          setLoading(false);
        }
      }
    };

    try {
      const { data } = supabase.auth.onAuthStateChange(handleAuthStateChange);
      subscription = data.subscription;
      void initialize();
    } catch (error) {
      logSafeError("[Auth] Failed to initialize authentication", error);
      if (active) {
        applySession(null);
        initializationSettled = true;
        setLoading(false);
      }
    }

    return () => {
      active = false;
      mountedRef.current = false;
      for (const timeoutId of roleLoadTimeouts) clearTimeout(timeoutId);
      roleLoadTimeouts.clear();

      try {
        subscription?.unsubscribe();
      } catch (error) {
        logSafeError("[Auth] Failed to unsubscribe from auth changes", error);
      }
    };
  }, [loadRoles]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshRoles = useCallback(async () => {
    if (activeUserIdRef.current) await loadRoles(activeUserIdRef.current);
  }, [loadRoles]);

  const isAdmin = roles.includes("admin");
  const isTesorero = roles.includes("tesorero");
  const isCatequista = roles.includes("catequista");
  const isSecretaria = roles.includes("secretaria");

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        roles,
        loading,
        isAdmin,
        isTesorero,
        isCatequista,
        isSecretaria,
        canSeePagos: isAdmin || isTesorero,
        canRegisterPagos: isAdmin || isTesorero || isSecretaria,
        canAccessPagosRetiro: isAdmin || isTesorero || isSecretaria || isCatequista,
        signOut,
        refreshRoles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
