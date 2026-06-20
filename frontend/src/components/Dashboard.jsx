import React, { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api.js";
import Message from "./Message.jsx";

const currency = new Intl.NumberFormat("en-IN", { 
  style: "currency", 
  currency: "INR", 
  maximumFractionDigits: 0 
});

export default function Dashboard({ refreshKey }) {
  const [summary, setSummary] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setError("");
        const [sRes, oRes] = await Promise.all([
          api.get("/dashboard/summary"),
          api.get("/orders", { params: { page: 1, limit: 5 } }),
        ]);
        setSummary(sRes.data);
        setRecentOrders(oRes.data.items || []);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }
    load();
  }, [refreshKey]);

  const s = summary || {};

  return (
    <div>
      <Message type="error" text={error} onClose={() => setError("")} />

      <div className="stats-grid">
        <div className="stat-card grad-blue">
          <div className="stat-icon">📦</div>
          <div className="stat-label">Total Products</div>
          <div className="stat-value">{s.total_products ?? 0}</div>
          <div className="stat-sub">{s.low_stock_count ?? 0} low stock</div>
        </div>

        <div className="stat-card grad-purple">
          <div className="stat-icon">👥</div>
          <div className="stat-label">Customers</div>
          <div className="stat-value">{s.total_customers ?? 0}</div>
          <div className="stat-sub">Registered accounts</div>
        </div>

        <div className="stat-card grad-green">
          <div className="stat-icon">🧾</div>
          <div className="stat-label">Orders</div>
          <div className="stat-value">{s.total_orders ?? 0}</div>
          <div className="stat-sub">{s.pending_orders ?? 0} pending</div>
        </div>

        <div className="stat-card grad-amber">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Revenue</div>
          <div className="stat-value">
            {currency.format(Number(s.total_sales_amount ?? 0))}
          </div>
          <div className="stat-sub">This month</div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {s.low_stock_count > 0 && (
        <div className="low-stock-alert">
          ⚠️ {s.low_stock_count} product{s.low_stock_count > 1 ? "s" : ""} running low — restock recommended
        </div>
      )}

      <div className="dash-grid">
        {/* Inventory Overview */}
        <div className="card card-pad">
          <div className="card-header">
            <h3>Inventory Overview</h3>
            <p>Current stock value & units</p>
          </div>
          <div className="metric-row">
            <span className="m-label">Total Units in Stock</span>
            <span className="m-value">{s.total_inventory_units ?? 0}</span>
          </div>
          <div className="metric-row">
            <span className="m-label">Inventory Value</span>
            <span className="m-value">{currency.format(Number(s.total_inventory_value ?? 0))}</span>
          </div>
          <div className="metric-row">
            <span className="m-label">Total Sales (excl. cancelled)</span>
            <span className="m-value" style={{ color: "var(--green)" }}>
              {currency.format(Number(s.total_sales_amount ?? 0))}
            </span>
          </div>
        </div>

        {/* Order Status */}
        <div className="card card-pad">
          <div className="card-header">
            <h3>Order Status</h3>
            <p>Breakdown by current status</p>
          </div>
          <div className="metric-row">
            <span className="m-label">🕐 Pending</span>
            <span className="badge badge-amber">{s.pending_orders ?? 0} orders</span>
          </div>
          <div className="metric-row">
            <span className="m-label">✅ Fulfilled</span>
            <span className="badge badge-green">{s.fulfilled_orders ?? 0} orders</span>
          </div>
          <div className="metric-row">
            <span className="m-label">❌ Cancelled</span>
            <span className="badge badge-red">{s.cancelled_orders ?? 0} orders</span>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card card-pad">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <p>Last 5 orders placed</p>
          </div>
          <div className="compact-list">
            {recentOrders.length > 0 ? (
              recentOrders.map((o) => (
                <div className="compact-row" key={o.id}>
                  <div className="cr-left">
                    <strong>Order #{o.id}</strong>
                    <span>{o.customer?.full_name || "Customer"}</span>
                  </div>
                  <div className="cr-right">
                    {currency.format(Number(o.total_amount))}
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No orders yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="card card-pad">
          <div className="card-header">
            <h3>⚠️ Low Stock</h3>
            <p>Products at or below threshold</p>
          </div>
          {s.low_stock_products?.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Stock</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {s.low_stock_products.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td><span className="badge badge-red">{p.quantity}</span></td>
                      <td>{currency.format(Number(p.price))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <p>All products are well stocked.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: "badge badge-amber",
    fulfilled: "badge badge-green",
    cancelled: "badge badge-red",
  };
  return <span className={map[status] || "badge badge-gray"}>{status}</span>;
}