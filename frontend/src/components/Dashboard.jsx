import React, { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api.js";
import Message from "./Message.jsx";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

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

  const s = summary;

  return (
    <div>
      <Message type="error" text={error} onClose={() => setError("")} />

      {/* Stats Row */}
      <div className="stats-grid">
        <div className="stat-card grad-blue">
          <div className="stat-icon">📦</div>
          <div className="stat-label">Products</div>
          <div className="stat-value">{s?.total_products ?? "—"}</div>
          <div className="stat-sub">{s?.low_stock_count ?? 0} low stock</div>
        </div>
        <div className="stat-card grad-purple">
          <div className="stat-icon">👥</div>
          <div className="stat-label">Customers</div>
          <div className="stat-value">{s?.total_customers ?? "—"}</div>
          <div className="stat-sub">Registered accounts</div>
        </div>
        <div className="stat-card grad-green">
          <div className="stat-icon">🧾</div>
          <div className="stat-label">Orders</div>
          <div className="stat-value">{s?.total_orders ?? "—"}</div>
          <div className="stat-sub">{s?.pending_orders ?? 0} pending</div>
        </div>
        <div className="stat-card grad-amber">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Sales Revenue</div>
          <div className="stat-value" style={{ fontSize: "1.4rem" }}>
            {s ? currency.format(Number(s.total_sales_amount)) : "—"}
          </div>
          <div className="stat-sub">Excl. cancelled orders</div>
        </div>
      </div>

      {/* Low stock alert */}
      {s?.low_stock_count > 0 && (
        <div className="low-stock-alert" style={{ marginBottom: "1.25rem" }}>
          ⚠️ {s.low_stock_count} product{s.low_stock_count > 1 ? "s are" : " is"} running low on stock — restock soon.
        </div>
      )}

      <div className="dash-grid">
        {/* Inventory Value */}
        <div className="card card-pad">
          <div className="card-header">
            <div><h3>Inventory Overview</h3><p>Current stock value & units</p></div>
          </div>
          <div className="metric-row"><span className="m-label">Total Units in Stock</span><span className="m-value">{s?.total_inventory_units ?? 0}</span></div>
          <div className="metric-row"><span className="m-label">Inventory Value</span><span className="m-value">{currency.format(Number(s?.total_inventory_value ?? 0))}</span></div>
          <div className="metric-row"><span className="m-label">Total Sales (excl. cancelled)</span><span className="m-value" style={{ color: "var(--green)" }}>{currency.format(Number(s?.total_sales_amount ?? 0))}</span></div>
        </div>

        {/* Order Status */}
        <div className="card card-pad">
          <div className="card-header">
            <div><h3>Order Status</h3><p>Breakdown by current status</p></div>
          </div>
          <div className="metric-row">
            <span className="m-label">🕐 Pending</span>
            <span className="badge badge-amber">{s?.pending_orders ?? 0} orders</span>
          </div>
          <div className="metric-row">
            <span className="m-label">✅ Fulfilled</span>
            <span className="badge badge-green">{s?.fulfilled_orders ?? 0} orders</span>
          </div>
          <div className="metric-row">
            <span className="m-label">❌ Cancelled</span>
            <span className="badge badge-red">{s?.cancelled_orders ?? 0} orders</span>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card card-pad">
          <div className="card-header">
            <div><h3>Recent Orders</h3><p>Last 5 orders placed</p></div>
          </div>
          <div className="compact-list">
            {recentOrders.map((o) => (
              <div className="compact-row" key={o.id}>
                <div className="cr-left">
                  <strong>Order #{o.id} — {o.customer.full_name}</strong>
                  <span>{o.items.length} item{o.items.length !== 1 ? "s" : ""} · {new Date(o.created_at).toLocaleDateString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  <span className="cr-right">{currency.format(Number(o.total_amount))}</span>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
            {!recentOrders.length && (
              <div className="empty-state" style={{ padding: "1.5rem" }}>
                <p>No orders yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="card card-pad">
          <div className="card-header">
            <div><h3>⚠️ Low Stock</h3><p>Products at or below threshold</p></div>
          </div>
          {s?.low_stock_products?.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {s.low_stock_products.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td><span className="badge badge-gray">{p.sku}</span></td>
                      <td><span className="badge badge-red">{p.quantity}</span></td>
                      <td>{currency.format(Number(p.price))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "1.5rem" }}>
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
    pending:   "badge badge-amber",
    fulfilled: "badge badge-green",
    cancelled: "badge badge-red",
  };
  return <span className={map[status] || "badge badge-gray"}>{status}</span>;
}
