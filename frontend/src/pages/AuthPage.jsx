import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../api.js";

const MAX_PASSWORD_LENGTH = 72;

export default function AuthPage() {
  const { login, register } = useAuth();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function change(e) {
    const { name, value } = e.target;

    if ((name === "password" || name === "confirm") && value.length > MAX_PASSWORD_LENGTH) {
      setError(`Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`);
      return;
    }

    setForm((f) => ({
      ...f,
      [name]: value,
    }));

    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!email) {
      return setError("Email address is required.");
    }

    if (!password) {
      return setError("Password is required.");
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      return setError(`Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`);
    }

    if (mode === "register") {
      const fullName = form.full_name.trim();

      if (!fullName) {
        return setError("Full name is required.");
      }

      if (password.length < 6) {
        return setError("Password must be at least 6 characters.");
      }

      if (password !== form.confirm) {
        return setError("Passwords do not match.");
      }
    }

    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(form.full_name.trim(), email, password);
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
    setForm({
      full_name: "",
      email: "",
      password: "",
      confirm: "",
    });
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
          <li>
            <span className="feat-icon">📦</span> Product & stock management
          </li>
          <li>
            <span className="feat-icon">👥</span> Customer records
          </li>
          <li>
            <span className="feat-icon">🧾</span> Order tracking & fulfilment
          </li>
          <li>
            <span className="feat-icon">📊</span> Real-time dashboard analytics
          </li>
          <li>
            <span className="feat-icon">🔒</span> JWT-secured API
          </li>
        </ul>

        <div className="auth-footer-note">
          Built with FastAPI · React · PostgreSQL · Docker
        </div>
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
                    maxLength={150}
                    disabled={loading}
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
                  maxLength={255}
                  disabled={loading}
                />
              </label>

              <label className="auth-label">
                Password
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={change}
                  placeholder={
                    mode === "register"
                      ? `Min 6 characters, max ${MAX_PASSWORD_LENGTH}`
                      : "Enter your password"
                  }
                  className="auth-input"
                  required
                  minLength={mode === "register" ? 6 : undefined}
                  maxLength={MAX_PASSWORD_LENGTH}
                  disabled={loading}
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
                    minLength={6}
                    maxLength={MAX_PASSWORD_LENGTH}
                    disabled={loading}
                  />
                </label>
              )}

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading
                  ? "Please wait…"
                  : mode === "login"
                    ? "Sign In →"
                    : "Create Account →"}
              </button>
            </form>

            <p className="auth-switch">
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => switchMode("register")}
                    disabled={loading}
                  >
                    Register here
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => switchMode("login")}
                    disabled={loading}
                  >
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