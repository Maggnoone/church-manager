import { vi } from "vitest";
import type { Session, User } from "@supabase/supabase-js";

export const mockUser: User = {
  id: "test-user-id",
  email: "test@example.com",
  created_at: new Date().toISOString(),
  role: "authenticated",
  aud: "authenticated",
  app_metadata: {},
  user_metadata: {},
  identities: [],
  updated_at: new Date().toISOString(),
} as User;

export const mockSession: Session = {
  access_token: "test-token",
  refresh_token: "test-refresh",
  expires_in: 3600,
  expires_at: Date.now() + 3600,
  token_type: "bearer",
  user: mockUser,
};

export function createMockSupabaseClient() {
  const authStateCallbacks: ((event: string, session: Session | null) => void)[] = [];

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockImplementation((callback: (event: string, session: Session | null) => void) => {
        authStateCallbacks.push(callback);
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        };
      }),
      getClaims: vi.fn().mockResolvedValue({ data: { claims: { sub: mockUser.id } }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      count: vi.fn().mockResolvedValue({ count: 0, data: [], error: null }),
      then: vi.fn().mockImplementation((cb: (v: unknown) => unknown) => Promise.resolve(cb({ data: [], error: null }))),
    }),
    // Helper to trigger auth state change in tests
    __triggerAuthStateChange: (event: string, session: Session | null) => {
      authStateCallbacks.forEach((cb) => cb(event, session));
    },
    __setSession: (session: Session | null) => {
      vi.mocked(createMockSupabaseClient).mockReturnValue({
        ...createMockSupabaseClient(),
        auth: {
          ...createMockSupabaseClient().auth,
          getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
        },
      });
    },
  };
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: createMockSupabaseClient(),
}));
