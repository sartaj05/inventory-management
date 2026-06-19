import React, { useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "../api.js";
import Message from "./Message.jsx";
import Pagination from "./Pagination.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

const emptyItem = { product_id: "", quantity: 1 };

const STATUS_COLORS = {
  pending: "badge badge-amber",
  fulfilled: "badge badge-green",
  cancelled: "badge badge-red",
};

export default function OrderManager({ onChange }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [data, setData] = useState({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    pages: 1,
  });

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([emptyItem]);
  const [notes, setNotes] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [msg, setMsg] = useState({ type: "", text: "" });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function loadMeta() {
    try {
      const [pRes, cRes] = await Promise.all([
        api.get("/products", { params: { limit: 100 } }),
        api.get("/customers", { params: { limit: 100 } }),
      ]);

      setProducts(pRes.data.items || []);
      setCustomers(cRes.data.items || []);
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    }
  }

  async function loadOrders(p = page) {
    try {
      const res = await api.get("/orders", {
        params: {
          ...(statusFilter ? { status: statusFilter } : {}),
          page: p,
          limit: 20,
        },
      });

      setData(res.data);
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    }
  }

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    setPage(1);
    loadOrders(1);
  }, [statusFilter]);

  useEffect(() => {
    loadOrders(page);
  }, [page]);

  const estimatedTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const p = products.find((x) => String(x.id) === String(item.product_id));

      return p ? sum + Number(p.price) * Number(item.quantity || 0) : sum;
    }, 0);
  }, [items, products]);

  function updateItem(i, field, val) {
    setItems((cur) =>
      cur.map((it, idx) => (idx === i ? { ...it, [field]: val } : it))
    );
  }

  function validate() {
    if (!customerId) return "Select a customer.";

    for (const item of items) {
      if (!item.product_id) return "Select a product for all rows.";
      if (Number(item.quantity) <= 0) return "Quantity must be > 0.";

      const p = products.find((x) => String(x.id) === String(item.product_id));

      if (p && Number(item.quantity) > Number(p.quantity)) {
        return `Only ${p.quantity} units available for "${p.name}".`;
      }
    }

    return "";
  }

  async function createOrder(e) {
    e.preventDefault();

    if (!isAdmin) {
      return setMsg({
        type: "error",
        text: "Viewer users cannot create orders.",
      });
    }

    const err = validate();
    if (err) return setMsg({ type: "error", text: err });

    try {
      await api.post("/orders", {
        customer_id: Number(customerId),
        items: items.map((it) => ({
          product_id: Number(it.product_id),
          quantity: Number(it.quantity),
        })),
        notes: notes || null,
      });

      setMsg({ type: "success", text: "Order created and stock updated." });

      setCustomerId("");
      setItems([emptyItem]);
      setNotes("");

      loadOrders(1);
      loadMeta();
      onChange?.();
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    }
  }

  async function updateStatus(orderId, newStatus) {
    if (!isAdmin) {
      return setMsg({
        type: "error",
        text: "Viewer users cannot update order status.",
      });
    }

    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });

      setMsg({
        type: "success",
        text: `Order #${orderId} marked as ${newStatus}.`,
      });

      loadOrders(page);
      loadMeta();

      if (selectedOrder?.id === orderId) {
        await viewOrderDetails(orderId);
      }

      onChange?.();
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    }
  }

  async function deleteOrder(id) {
    if (!isAdmin) {
      return setMsg({
        type: "error",
        text: "Viewer users cannot delete orders.",
      });
    }

    if (!confirm("Delete this order? Stock will be restored if not already cancelled.")) {
      return;
    }

    try {
      await api.delete(`/orders/${id}`);

      setMsg({ type: "success", text: "Order deleted." });

      if (selectedOrder?.id === id) {
        setSelectedOrder(null);
      }

      loadOrders(page);
      loadMeta();
      onChange?.();
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    }
  }

  async function viewOrderDetails(orderId) {
    try {
      setDetailLoading(true);

      const res = await api.get(`/orders/${orderId}`);

      setSelectedOrder(res.data);
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div>
      <Message
        type={msg.type}
        text={msg.text}
        onClose={() => setMsg({ type: "", text: "" })}
      />

      {!isAdmin && (
        <div className="msg msg-info" style={{ marginBottom: "1rem" }}>
          <span>ℹ</span>
          <span>
            You are logged in as <strong>viewer</strong>. You can view orders,
            but create, update, cancel, and delete actions are disabled.
          </span>
        </div>
      )}

      <div className={isAdmin ? "manager-layout" : ""}>
        {isAdmin && (
          <form
            className="card card-pad"
            onSubmit={createOrder}
            style={{ display: "grid", gap: "1rem" }}
          >
            <div className="card-header">
              <div>
                <h3>➕ Create Order</h3>
                <p>Stock is reduced automatically on submit.</p>
              </div>
            </div>

            <label>
              Customer
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              >
                <option value="">Select customer…</option>

                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} — {c.email}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.6rem",
                }}
              >
                <strong style={{ fontSize: "0.85rem" }}>Order Items</strong>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setItems((i) => [...i, emptyItem])}
                >
                  + Add Row
                </button>
              </div>

              <div style={{ display: "grid", gap: "0.5rem" }}>
                {items.map((item, idx) => {
                  const prod = products.find(
                    (x) => String(x.id) === String(item.product_id)
                  );

                  return (
                    <div className="order-item-builder" key={idx}>
                      <label style={{ gap: "0.25rem" }}>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--ink3)",
                          }}
                        >
                          Product
                        </span>

                        <select
                          value={item.product_id}
                          onChange={(e) =>
                            updateItem(idx, "product_id", e.target.value)
                          }
                        >
                          <option value="">Select…</option>

                          {products.map((p) => (
                            <option
                              key={p.id}
                              value={p.id}
                              disabled={p.quantity === 0}
                            >
                              {p.name} ({p.sku}) — Qty: {p.quantity}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={{ gap: "0.25rem" }}>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--ink3)",
                          }}
                        >
                          Qty
                        </span>

                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(idx, "quantity", e.target.value)
                          }
                        />
                      </label>

                      <div className="item-line-total">
                        {prod
                          ? currency.format(
                              Number(prod.price) * Number(item.quantity || 0)
                            )
                          : "—"}
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-icon"
                          onClick={() =>
                            setItems((i) => i.filter((_, j) => j !== idx))
                          }
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="total-box">
              <span>Estimated Total</span>
              <strong>{currency.format(estimatedTotal)}</strong>
            </div>

            <label>
              Notes (optional)
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any order notes…"
                style={{ minHeight: 55 }}
              />
            </label>

            <button className="btn btn-primary" type="submit">
              Create Order
            </button>
          </form>
        )}

        <div className="card card-pad">
          <div className="toolbar" style={{ flexWrap: "wrap" }}>
            <div>
              <h3 style={{ fontWeight: 800, marginBottom: 2 }}>Orders</h3>

              <p style={{ fontSize: "0.8rem", color: "var(--ink3)" }}>
                {data.total} total orders
              </p>
            </div>

            <div className="status-group">
              {[
                ["", "All"],
                ["pending", "Pending"],
                ["fulfilled", "Fulfilled"],
                ["cancelled", "Cancelled"],
              ].map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  className={`status-btn ${
                    statusFilter === v ? "active-" + (v || "all") : ""
                  }`}
                  onClick={() => setStatusFilter(v)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            {data.items.map((order) => (
              <div className="order-card" key={order.id}>
                <div className="order-head">
                  <div className="order-head-left">
                    <h4>Order #{order.id}</h4>

                    <p>
                      {order.customer.full_name} · {order.customer.email}
                    </p>

                    <p>{new Date(order.created_at).toLocaleString("en-IN")}</p>

                    {order.notes && (
                      <p style={{ fontStyle: "italic", marginTop: 2 }}>
                        "{order.notes}"
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "0.4rem",
                    }}
                  >
                    <span className="order-total">
                      {currency.format(Number(order.total_amount))}
                    </span>

                    <span className={STATUS_COLORS[order.status] || "badge badge-gray"}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <ul className="order-items-list">
                  {order.items.map((it) => (
                    <li className="order-item-row" key={it.id}>
                      <span>
                        {it.product.name}{" "}
                        <span style={{ color: "var(--ink3)" }}>
                          ({it.product.sku})
                        </span>
                      </span>

                      <span>
                        {it.quantity} × {currency.format(Number(it.unit_price))}
                      </span>

                      <strong>{currency.format(Number(it.line_total))}</strong>
                    </li>
                  ))}
                </ul>

                <div className="order-foot">
                  <div className="btn-group">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={detailLoading}
                      onClick={() => viewOrderDetails(order.id)}
                    >
                      👁 View Details
                    </button>

                    {isAdmin && order.status === "pending" && (
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => updateStatus(order.id, "fulfilled")}
                      >
                        ✅ Fulfill
                      </button>
                    )}

                    {isAdmin && order.status !== "cancelled" && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => updateStatus(order.id, "cancelled")}
                      >
                        Cancel
                      </button>
                    )}

                    {isAdmin && order.status === "cancelled" && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => updateStatus(order.id, "pending")}
                      >
                        ↩ Reactivate
                      </button>
                    )}
                  </div>

                  {isAdmin ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => deleteOrder(order.id)}
                    >
                      🗑 Delete
                    </button>
                  ) : (
                    <span className="badge badge-gray">View only</span>
                  )}
                </div>
              </div>
            ))}

            {!data.items.length && (
              <div className="empty-state">
                <div className="empty-icon">🧾</div>
                <p>No orders match this filter.</p>
              </div>
            )}
          </div>

          <Pagination {...data} onPageChange={(p) => setPage(p)} />
        </div>
      </div>

      {detailLoading && !selectedOrder && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Loading order details...</h3>
                <p>Please wait.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Order #{selectedOrder.id}</h3>

                <p>
                  {selectedOrder.customer?.full_name} ·{" "}
                  {selectedOrder.customer?.email}
                </p>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setSelectedOrder(null)}
              >
                ✕
              </button>
            </div>

            <div className="order-detail-grid">
              <div className="detail-box">
                <span>Status</span>

                <strong
                  className={STATUS_COLORS[selectedOrder.status] || "badge badge-gray"}
                >
                  {selectedOrder.status}
                </strong>
              </div>

              <div className="detail-box">
                <span>Total Amount</span>
                <strong>
                  {currency.format(Number(selectedOrder.total_amount))}
                </strong>
              </div>

              <div className="detail-box">
                <span>Created Date</span>
                <strong>
                  {new Date(selectedOrder.created_at).toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="detail-box">
                <span>Customer Phone</span>
                <strong>{selectedOrder.customer?.phone || "—"}</strong>
              </div>
            </div>

            {selectedOrder.notes && (
              <div className="detail-notes">
                <span>Notes</span>
                <p>{selectedOrder.notes}</p>
              </div>
            )}

            <div className="table-wrap" style={{ marginTop: "1rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Line Total</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedOrder.items?.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.product?.name}</strong>
                      </td>

                      <td>
                        <span className="badge badge-gray">
                          {item.product?.sku}
                        </span>
                      </td>

                      <td>{item.quantity}</td>

                      <td>{currency.format(Number(item.unit_price))}</td>

                      <td>
                        <strong>
                          {currency.format(Number(item.line_total))}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              {isAdmin && selectedOrder.status === "pending" && (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => updateStatus(selectedOrder.id, "fulfilled")}
                >
                  ✅ Fulfill Order
                </button>
              )}

              {isAdmin && selectedOrder.status !== "cancelled" && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => updateStatus(selectedOrder.id, "cancelled")}
                >
                  Cancel Order
                </button>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}