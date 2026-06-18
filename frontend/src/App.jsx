import { useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import ProductManager from "./components/ProductManager.jsx";
import CustomerManager from "./components/CustomerManager.jsx";
import OrderManager from "./components/OrderManager.jsx";
import { API_BASE_URL } from "./api.js";

const tabs = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Products" },
  { key: "customers", label: "Customers" },
  { key: "orders", label: "Orders" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((current) => current + 1);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">IMS</div>
          <div>
            <h1>Inventory System</h1>
            <p>Products, Customers & Orders</p>
          </div>
        </div>

        <nav>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? "active" : ""}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="api-box">
          <strong>API</strong>
          <span>{API_BASE_URL}</span>
        </div>
      </aside>

      <main className="content">
        {activeTab === "dashboard" && <Dashboard refreshKey={refreshKey} />}
        {activeTab === "products" && <ProductManager onChange={refresh} />}
        {activeTab === "customers" && <CustomerManager onChange={refresh} />}
        {activeTab === "orders" && <OrderManager onChange={refresh} />}
      </main>
    </div>
  );
}
