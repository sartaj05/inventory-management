import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api.js";
import Message from "./Message.jsx";

export default function Dashboard({ refreshKey }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  async function loadSummary() {
    try {
      setError("");
      const response = await api.get("/dashboard/summary");
      setSummary(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  useEffect(() => {
    loadSummary();
  }, [refreshKey]);

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Quick overview of inventory, customers, and orders.</p>
        </div>
      </div>

      <Message type="error" text={error} />

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Products</span>
          <strong>{summary?.total_products ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Total Customers</span>
          <strong>{summary?.total_customers ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Total Orders</span>
          <strong>{summary?.total_orders ?? 0}</strong>
        </div>
        <div className="stat-card warning">
          <span>Low Stock Items</span>
          <strong>{summary?.low_stock_products?.length ?? 0}</strong>
        </div>
      </div>

      <div className="card">
        <h3>Low Stock Products</h3>
        {summary?.low_stock_products?.length ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Available Qty</th>
                </tr>
              </thead>
              <tbody>
                {summary.low_stock_products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>₹{Number(product.price).toFixed(2)}</td>
                    <td>{product.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No low stock products.</p>
        )}
      </div>
    </section>
  );
}
