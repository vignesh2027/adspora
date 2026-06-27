import { createContext, useContext, useState, useEffect, useCallback } from "react";
import API, { formatApiError } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=checking, false=not auth
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await API.get("/auth/me");
      setUser(data);
    } catch {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (email, password) => {
    const { data } = await API.post("/auth/login", { email, password });
    if (data.token) localStorage.setItem("adspora_token", data.token);
    setUser(data);
    return data;
  };

  const register = async (email, password, name) => {
    const { data } = await API.post("/auth/register", { email, password, name });
    if (data.token) localStorage.setItem("adspora_token", data.token);
    setUser(data);
    return data;
  };

  const demoLogin = async () => {
    const { data } = await API.post("/auth/demo");
    if (data.token) localStorage.setItem("adspora_token", data.token);
    setUser(data);
    return data;
  };

  const logout = async () => {
    try { await API.post("/auth/logout"); } catch {}
    localStorage.removeItem("adspora_token");
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
