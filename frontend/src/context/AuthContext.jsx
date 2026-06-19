import React, { createContext, useContext, useState, useCallback } from "react";
import api, { getErrorMessage } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("ims_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const saveSession = useCallback((data) => {
    localStorage.setItem("ims_token", data.access_token);
    localStorage.setItem("ims_user", JSON.stringify({
      id: data.user_id,
      full_name: data.full_name,
      email: data.email,
      role: data.role,
    }));
    setUser({ id: data.user_id, full_name: data.full_name, email: data.email, role: data.role });
  }, []);

  const login = useCallback(async (email, password) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    const res = await api.post("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    saveSession(res.data);
    return res.data;
  }, [saveSession]);

  const register = useCallback(async (full_name, email, password) => {
    const res = await api.post("/auth/register", { full_name, email, password });
    saveSession(res.data);
    return res.data;
  }, [saveSession]);

  const logout = useCallback(() => {
    localStorage.removeItem("ims_token");
    localStorage.removeItem("ims_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
