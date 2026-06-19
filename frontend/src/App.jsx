import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ProductManager from "./components/ProductManager.jsx";
import CustomerManager from "./components/CustomerManager.jsx";
import OrderManager from "./components/OrderManager.jsx";
import { API_BASE_URL } from "./api.js";
import api from "./api.js";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "products",  label: "Products",  icon: "📦" },
  { key: "customers", label: "Customers", icon: "👥" },
  { key: "orders",    label: "Orders",    icon: "🧾" },
];

function AppShell() {
  const { user, logout, isAuthenticated } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  function refresh() { setRefreshKey((k) => k + 1); }

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get("/dashboard/summary")
      .then((r) => {
        setLowStock(r.data.low_stock_count ?? 0);
        setPendingOrders(r.data.pending_orders ?? 0);
      })
      .catch(() => {});
  }, [refreshKey, isAuthenticated]);

  if (!isAuthenticated) return <AuthPage />;

  function badge(key) {
    if (key === "products" && lowStock > 0) return lowStock;
    if (key === "orders" && pendingOrders > 0) return pendingOrders;
    return null;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-inner">
          <div className="brand">
            <div className="brand-logo">IMS</div>
            <div className="brand-text">
              <h1>Inventory System</h1>
              <p>v2.0 · Assessment Build</p>
            </div>
          </div>

          <div className="nav-section-label">Navigation</div>
          <nav className="nav-list">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`nav-item ${tab === t.key ? "active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                <span className="nav-icon">{t.icon}</span>
                {t.label}
                {badge(t.key) ? <span className="nav-badge">{badge(t.key)}</span> : null}
              </button>
            ))}
          </nav>

          {/* User info */}
          <div className="user-panel">
            <div className="user-avatar">{user?.full_name?.[0]?.toUpperCase() || "U"}</div>
            <div className="user-info">
              <strong>{user?.full_name}</strong>
              <span>{user?.email}</span>
            </div>
          </div>

          <div className="sidebar-footer">
            <button className="btn-logout" onClick={logout}>← Sign Out</button>
            <div className="api-pill">
              <span className="dot" />
              <div>
                <strong>Backend API</strong>
                <small>{API_BASE_URL}</small>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div className="topbar-left">
            <div className="eyebrow">Inventory & Order Management</div>
            <h2>{TABS.find((t) => t.key === tab)?.label}</h2>
          </div>
          <div className="topbar-right">
            <span className="topbar-user">👤 {user?.full_name}</span>
            <button className="btn btn-secondary" onClick={refresh}>↻ Refresh</button>
          </div>
        </header>

        <div className="page-body">
          {tab === "dashboard" && <Dashboard refreshKey={refreshKey} />}
          {tab === "products"  && <ProductManager onChange={refresh} />}
          {tab === "customers" && <CustomerManager onChange={refresh} />}
          {tab === "orders"    && <OrderManager onChange={refresh} />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
