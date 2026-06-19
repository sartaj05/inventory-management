import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../api.js";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function change(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (!form.full_name.trim()) return setError("Full name is required.");
      if (form.password.length < 6) return setError("Password must be at least 6 characters.");
      if (form.password !== form.confirm) return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form.full_name, form.email, form.password);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function switchMode(m) {
    setMode(m);
    setError("");
    setForm({ full_name: "", email: "", password: "", confirm: "" });
  }

  return (
    <div className="auth-shell">
      {/* Left panel — branding */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo">IMS</div>
          <h1>Inventory System</h1>
          <p>Production-ready inventory & order management</p>
        </div>
        <ul className="auth-features">
          <li><span className="feat-icon">📦</span> Product & stock management</li>
          <li><span className="feat-icon">👥</span> Customer records</li>
          <li><span className="feat-icon">🧾</span> Order tracking & fulfilment</li>
          <li><span className="feat-icon">📊</span> Real-time dashboard analytics</li>
          <li><span className="feat-icon">🔒</span> JWT-secured API</li>
        </ul>
        <div className="auth-footer-note">Built with FastAPI · React · PostgreSQL · Docker</div>
      </div>

      {/* Right panel — form */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => switchMode("login")}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => switchMode("register")}
              type="button"
            >
              Create Account
            </button>
          </div>

          <div className="auth-card-body">
            <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
            <p className="auth-subtitle">
              {mode === "login"
                ? "Sign in to access your inventory dashboard."
                : "Set up your IMS account in seconds."}
            </p>

            {error && (
              <div className="auth-error">
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={submit} className="auth-form">
              {mode === "register" && (
                <label className="auth-label">
                  Full Name
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={change}
                    placeholder="Rahul Sharma"
                    className="auth-input"
                    required
                    autoFocus
                  />
                </label>
              )}

              <label className="auth-label">
                Email Address
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={change}
                  placeholder="you@example.com"
                  className="auth-input"
                  required
                  autoFocus={mode === "login"}
                />
              </label>

              <label className="auth-label">
                Password
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={change}
                  placeholder={mode === "register" ? "Min 6 characters" : "Enter your password"}
                  className="auth-input"
                  required
                />
              </label>

              {mode === "register" && (
                <label className="auth-label">
                  Confirm Password
                  <input
                    name="confirm"
                    type="password"
                    value={form.confirm}
                    onChange={change}
                    placeholder="Re-enter password"
                    className="auth-input"
                    required
                  />
                </label>
              )}

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading
                  ? "Please wait…"
                  : mode === "login" ? "Sign In →" : "Create Account →"}
              </button>
            </form>

            <p className="auth-switch">
              {mode === "login" ? (
                <>Don't have an account?{" "}
                  <button type="button" className="auth-link" onClick={() => switchMode("register")}>
                    Register here
                  </button>
                </>
              ) : (
                <>Already have an account?{" "}
                  <button type="button" className="auth-link" onClick={() => switchMode("login")}>
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
