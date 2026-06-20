import React, { useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "../api.js";
import Message from "./Message.jsx";
import Pagination from "./Pagination.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

const empty = {
  name: "",
  sku: "",
  description: "",
  price: "",
  quantity: "",
  category: "",
};

export default function ProductManager({ onChange }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [data, setData] = useState({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    pages: 1,
  });

  const [form, setForm] = useState(empty);

  // editTarget holds the product object currently open in the edit modal.
  // null = modal closed. Replaces the old inline "editId driven form" flow.
  const [editTarget, setEditTarget] = useState(null);

  // id of the product pending delete confirmation (drives the confirm modal)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  async function load(p = page) {
    try {
      setLoading(true);

      const res = await api.get("/products", {
        params: {
          ...(search ? { q: search } : {}),
          ...(category ? { category } : {}),
          page: p,
          limit: 20,
        },
      });

      setData(res.data);
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load(1);
    }, 280);

    return () => clearTimeout(t);
  }, [search, category]);

  useEffect(() => {
    load(page);
  }, [page]);

  const inventoryValue = useMemo(() => {
    return data.items.reduce(
      (s, p) => s + Number(p.price) * Number(p.quantity),
      0
    );
  }, [data.items]);

  function change(e) {
    const { name, value } = e.target;

    setForm((f) => ({
      ...f,
      [name]: value,
    }));
  }

  function validate() {
    if (!form.name.trim() || !form.sku.trim()) {
      return "Name and SKU are required.";
    }

    if (Number(form.price) <= 0) {
      return "Price must be greater than 0.";
    }

    if (Number(form.quantity) < 0) {
      return "Quantity cannot be negative.";
    }

    return "";
  }

  // Add-product flow uses the inline left-side form (unchanged).
  async function submit(e) {
    e.preventDefault();

    if (!isAdmin) {
      return setMsg({
        type: "error",
        text: "Viewer users cannot create products.",
      });
    }

    const err = validate();
    if (err) return setMsg({ type: "error", text: err });

    const payload = {
      name: form.name,
      sku: form.sku,
      description: form.description || null,
      price: Number(form.price),
      quantity: Number(form.quantity),
      category: form.category || null,
    };

    try {
      await api.post("/products", payload);
      setMsg({ type: "success", text: "Product added." });

      setForm(empty);

      load(page);
      onChange?.();
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    }
  }

  function openEdit(p) {
    if (!isAdmin) return;

    setEditTarget({
      id: p.id,
      name: p.name,
      sku: p.sku,
      description: p.description || "",
      price: p.price,
      quantity: p.quantity,
      category: p.category || "",
    });
  }

  function closeEdit() {
    setEditTarget(null);
  }

  function editChange(e) {
    const { name, value } = e.target;
    setEditTarget((t) => ({ ...t, [name]: value }));
  }

  function validateEdit(t) {
    if (!t.name.trim() || !t.sku.trim()) {
      return "Name and SKU are required.";
    }
    if (Number(t.price) <= 0) {
      return "Price must be greater than 0.";
    }
    if (Number(t.quantity) < 0) {
      return "Quantity cannot be negative.";
    }
    return "";
  }

  async function saveEdit(e) {
    e.preventDefault();

    if (!isAdmin || !editTarget) return;

    const err = validateEdit(editTarget);
    if (err) return setMsg({ type: "error", text: err });

    const payload = {
      name: editTarget.name,
      sku: editTarget.sku,
      description: editTarget.description || null,
      price: Number(editTarget.price),
      quantity: Number(editTarget.quantity),
      category: editTarget.category || null,
    };

    try {
      setSaving(true);

      await api.put(`/products/${editTarget.id}`, payload);

      setMsg({ type: "success", text: "Product updated." });
      setEditTarget(null);

      load(page);
      onChange?.();
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  function askDelete(id) {
    if (!isAdmin) {
      return setMsg({
        type: "error",
        text: "Viewer users cannot delete products.",
      });
    }

    setConfirmDeleteId(id);
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return;

    try {
      setDeleting(true);

      await api.delete(`/products/${confirmDeleteId}`);

      setMsg({ type: "success", text: "Product deleted." });
      setConfirmDeleteId(null);

      load(page);
      onChange?.();
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    } finally {
      setDeleting(false);
    }
  }

  const deleteTargetProduct = data.items.find(
    (p) => p.id === confirmDeleteId
  );

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
            You are logged in as <strong>viewer</strong>. You can view products,
            but create, update, and delete actions are disabled.
          </span>
        </div>
      )}

      <div className={isAdmin ? "manager-layout" : ""}>
        {isAdmin && (
          <form
            className="card card-pad"
            onSubmit={submit}
            style={{ display: "grid", gap: "1rem" }}
          >
            <div className="card-header">
              <div>
                <h3>➕ Add Product</h3>
                <p>SKU is auto-uppercased and must be unique.</p>
              </div>
            </div>

            <label>
              Product Name
              <input
                name="name"
                value={form.name}
                onChange={change}
                placeholder="e.g. Wireless Keyboard"
                required
              />
            </label>

            <div className="form-row">
              <label>
                SKU / Code
                <input
                  name="sku"
                  value={form.sku}
                  onChange={change}
                  placeholder="e.g. WK-001"
                  required
                />
              </label>

              <label>
                Category
                <input
                  name="category"
                  value={form.category}
                  onChange={change}
                  placeholder="e.g. Electronics"
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Price (₹)
                <input
                  name="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={change}
                  required
                />
              </label>

              <label>
                Quantity
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={change}
                  required
                />
              </label>
            </div>

            <label>
              Description (optional)
              <textarea
                name="description"
                value={form.description}
                onChange={change}
                placeholder="Short product description..."
              />
            </label>

            <div className="btn-group">
              <button className="btn btn-primary" type="submit">
                Add Product
              </button>
            </div>
          </form>
        )}

        <div className="card card-pad">
          <div className="toolbar">
            <div>
              <h3 style={{ fontWeight: 800, marginBottom: 2 }}>
                Product Inventory
              </h3>

              <p style={{ fontSize: "0.8rem", color: "var(--ink3)" }}>
                {data.total} products · {currency.format(inventoryValue)} total
                value
              </p>
            </div>

            <div className="btn-group">
              <input
                className="search-bar"
                style={{ maxWidth: 200 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name / SKU…"
              />

              <input
                style={{ maxWidth: 150 }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Filter category…"
              />
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>

                      {p.description && (
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--ink3)",
                            marginTop: 2,
                          }}
                        >
                          {p.description.slice(0, 50)}
                          {p.description.length > 50 ? "…" : ""}
                        </div>
                      )}
                    </td>

                    <td>
                      <span className="badge badge-blue">{p.sku}</span>
                    </td>

                    <td>
                      {p.category ? (
                        <span className="badge badge-gray">{p.category}</span>
                      ) : (
                        <span style={{ color: "var(--ink3)" }}>—</span>
                      )}
                    </td>

                    <td style={{ fontWeight: 700 }}>
                      {currency.format(Number(p.price))}
                    </td>

                    <td style={{ fontWeight: 700 }}>{p.quantity}</td>

                    <td>
                      {p.quantity === 0 ? (
                        <span className="badge badge-red">Out of Stock</span>
                      ) : p.quantity <= 5 ? (
                        <span className="badge badge-amber">Low</span>
                      ) : (
                        <span className="badge badge-green">In Stock</span>
                      )}
                    </td>

                    <td>
                      {isAdmin ? (
                        <div className="btn-group">
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            type="button"
                            onClick={() => openEdit(p)}
                          >
                            ✏️
                          </button>

                          <button
                            className="btn btn-danger btn-sm btn-icon"
                            type="button"
                            onClick={() => askDelete(p.id)}
                          >
                            🗑
                          </button>
                        </div>
                      ) : (
                        <span className="badge badge-gray">View only</span>
                      )}
                    </td>
                  </tr>
                ))}

                {!data.items.length && !loading && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-icon">📦</div>
                        <p>No products found.</p>
                      </div>
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        color: "var(--ink3)",
                        padding: "2rem",
                      }}
                    >
                      Loading…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination {...data} onPageChange={(p) => setPage(p)} />
        </div>
      </div>

      {/* ───────── Edit Product Modal ───────── */}
      {editTarget && (
        <div className="modal-backdrop" onClick={closeEdit}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={saveEdit} style={{ display: "grid", gap: "1rem" }}>
              <div className="modal-header" style={{ position: "static" }}>
                <div>
                  <h3>✏️ Edit Product</h3>
                  <p>Update details for "{editTarget.name}"</p>
                </div>

                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  onClick={closeEdit}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: "0 1.75rem", display: "grid", gap: "1rem" }}>
                <label>
                  Product Name
                  <input
                    name="name"
                    value={editTarget.name}
                    onChange={editChange}
                    required
                  />
                </label>

                <div className="form-row">
                  <label>
                    SKU / Code
                    <input
                      name="sku"
                      value={editTarget.sku}
                      onChange={editChange}
                      required
                    />
                  </label>

                  <label>
                    Category
                    <input
                      name="category"
                      value={editTarget.category}
                      onChange={editChange}
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label>
                    Price (₹)
                    <input
                      name="price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={editTarget.price}
                      onChange={editChange}
                      required
                    />
                  </label>

                  <label>
                    Quantity
                    <input
                      name="quantity"
                      type="number"
                      min="0"
                      value={editTarget.quantity}
                      onChange={editChange}
                      required
                    />
                  </label>
                </div>

                <label>
                  Description (optional)
                  <textarea
                    name="description"
                    value={editTarget.description}
                    onChange={editChange}
                  />
                </label>
              </div>

              <div className="modal-footer" style={{ position: "static" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeEdit}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────── Delete Confirm Modal ───────── */}
      {confirmDeleteId && (
        <div
          className="modal-backdrop"
          onClick={() => !deleting && setConfirmDeleteId(null)}
        >
          <div
            className="confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon confirm-icon-danger">🗑</div>

            <h3>Delete this product?</h3>

            <p>
              {deleteTargetProduct
                ? `"${deleteTargetProduct.name}" (${deleteTargetProduct.sku}) will be permanently removed. This cannot be undone.`
                : "This product will be permanently removed. This cannot be undone."}
            </p>

            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-danger-solid"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}