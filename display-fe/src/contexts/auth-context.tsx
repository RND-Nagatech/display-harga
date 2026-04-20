import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { clearToken, getToken, setToken, type AuthUser as AuthUserType } from "@/lib/auth";
import * as backend from "@/lib/backend";

type AuthState = {
  user: AuthUserType | null;
  loading: boolean;
  login: (username: string, password: string, remember: boolean) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }
    setLoading(true);
    backend
      .getMe()
      .then((me) => setUser({ id: me.id, username: me.username, level: me.level }))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(username: string, password: string, remember: boolean) {
    setLoading(true);
    try {
      const data = await backend.login(username, password);
      setToken(data.token, remember);
      setUser({ id: data.user.id, username: data.user.username, level: data.user.level });
      toast.success(`Selamat datang, ${data.user.username}`);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Login gagal");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearToken();
    setUser(null);
    toast.success("Logout berhasil");
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAdmin: user?.level === "admin",
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

