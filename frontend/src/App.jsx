import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";

import Dashboard from "./components/Dashboard.jsx";
import ProductManager from "./components/ProductManager.jsx";
import CustomerManager from "./components/CustomerManager.jsx";
import OrderManager from "./components/OrderManager.jsx";

import { API_BASE_URL } from "./api.js";
import api from "./api.js";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "products", label: "Products", icon: "📦" },
  { key: "customers", label: "Customers", icon: "👥" },
  { key: "orders", label: "Orders", icon: "🧾" },
];

/* ================= MODERN APP SHELL ================= */

function AppShell() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  useEffect(() => {
    if (!isAuthenticated) return;

    api.get("/dashboard/summary")
      .then((r) => {
        setLowStock(r.data.low_stock_count ?? 0);
        setPendingOrders(r.data.pending_orders ?? 0);
      })
      .catch(() => {});
  }, [refreshKey, isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/auth" />;

  function badge(key) {
    if (key === "products" && lowStock > 0) return lowStock;
    if (key === "orders" && pendingOrders > 0) return pendingOrders;
    return null;
  }

  return (
    <div className="app-shell">
      {/* MODERN SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-inner">
          {/* Brand */}
          <div className="brand">
            <div className="brand-logo">IMS</div>
            <div className="brand-text">
              <h1>Inventory System</h1>
              <p>Modern Operations</p>
            </div>
          </div>

          <div className="nav-section-label">CORE</div>

          <nav className="nav-list">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`nav-item ${tab === t.key ? "active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                <span className="nav-icon">{t.icon}</span>
                <span className="nav-label">{t.label}</span>
                {badge(t.key) && (
                  <span className="nav-badge">{badge(t.key)}</span>
                )}
              </button>
            ))}
          </nav>



          {/* FOOTER */}
          <div className="sidebar-footer">
            <button
              className="btn-logout"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="content">
        <header className="topbar">
          <div className="topbar-left">
            <div className="eyebrow">Inventory & Order Management</div>
            <h2>{TABS.find((t) => t.key === tab)?.label}</h2>
          </div>

          <div className="topbar-right">
            <span className="topbar-user">👤 {user?.full_name}</span>
            <button className="btn btn-secondary" onClick={refresh}>
              ↻ Refresh
            </button>
          </div>
        </header>

        <div className="page-body">
          {tab === "dashboard" && <Dashboard refreshKey={refreshKey} />}
          {tab === "products" && <ProductManager onChange={refresh} />}
          {tab === "customers" && <CustomerManager onChange={refresh} />}
          {tab === "orders" && <OrderManager onChange={refresh} />}
        </div>
      </main>
    </div>
  );
}

/* ================= ROUTES ================= */

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/auth"
        element={isAuthenticated ? <Navigate to="/app" /> : <AuthPage />}
      />

      <Route
        path="/app"
        element={isAuthenticated ? <AppShell /> : <Navigate to="/auth" />}
      />
    </Routes>
  );
}

/* ================= ROOT ================= */

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}