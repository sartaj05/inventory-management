import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../api.js";
import { useNavigate } from "react-router-dom";

const MAX_PASSWORD_LENGTH = 72;

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
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

    if (
      (name === "password" || name === "confirm") &&
      value.length > MAX_PASSWORD_LENGTH
    ) {
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

    if (!email) return setError("Email address is required.");
    if (!password) return setError("Password is required.");

    if (password.length > MAX_PASSWORD_LENGTH) {
      return setError(
        `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`
      );
    }

    if (mode === "register") {
      const fullName = form.full_name.trim();

      if (!fullName) return setError("Full name is required.");
      if (password.length < 6)
        return setError("Password must be at least 6 characters.");
      if (password !== form.confirm)
        return setError("Passwords do not match.");
    }

    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(form.full_name.trim(), email, password);
      }

      // ✅ REDIRECT AFTER SUCCESS
      navigate("/app");
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
      {/* LEFT SIDE */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo">IMS</div>
          <h1>Inventory System</h1>
          <p>Modern inventory & order management platform</p>
        </div>

        <ul className="auth-features">
          <li>📦 Smart product tracking</li>
          <li>👥 Customer management</li>
          <li>🧾 Order lifecycle control</li>
          <li>📊 Real-time analytics</li>
          <li>🔒 Secure authentication</li>
        </ul>

        <div className="auth-footer-note">
          FastAPI · React · PostgreSQL · Docker
        </div>
      </div>

      {/* RIGHT SIDE */}
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
            <h2>
              {mode === "login"
                ? "Welcome back 👋"
                : "Create your account 🚀"}
            </h2>

            <p className="auth-subtitle">
              {mode === "login"
                ? "Login to continue to your dashboard"
                : "Start managing your inventory in seconds"}
            </p>

            {error && <div className="auth-error">⚠ {error}</div>}

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
                    disabled={loading}
                  />
                </label>
              )}

              <label className="auth-label">
                Email
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={change}
                  placeholder="you@example.com"
                  className="auth-input"
                  required
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
                  className="auth-input"
                  placeholder="Enter password"
                  required
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
                    className="auth-input"
                    placeholder="Confirm password"
                    required
                    disabled={loading}
                  />
                </label>
              )}

              <button className="auth-submit" disabled={loading}>
                {loading
                  ? "Processing..."
                  : mode === "login"
                  ? "Sign In →"
                  : "Create Account →"}
              </button>
            </form>

            <p className="auth-switch">
              {mode === "login" ? (
                <>
                  Don’t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="auth-link"
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="auth-link"
                  >
                    Sign In
                  </button>
                </>
              )}
            </p>

            {/* 👇 back to landing */}
            <p style={{ marginTop: "10px" }}>
              <button
                onClick={() => navigate("/")}
                className="auth-link"
                type="button"
              >
                ← Back to Home
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}