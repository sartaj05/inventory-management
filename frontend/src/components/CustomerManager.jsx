import React, { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api.js";
import Message from "./Message.jsx";
import Pagination from "./Pagination.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const empty = {
  full_name: "",
  email: "",
  phone: "",
  address: "",
};

export default function CustomerManager({ onChange }) {
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

  // editTarget holds the customer object currently open in the edit modal.
  const [editTarget, setEditTarget] = useState(null);

  // id of the customer pending delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  async function load(p = page) {
    try {
      setLoading(true);

      const res = await api.get("/customers", {
        params: {
          ...(search ? { q: search } : {}),
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
  }, [search]);

  useEffect(() => {
    load(page);
  }, [page]);

  function change(e) {
    const { name, value } = e.target;

    setForm((f) => ({
      ...f,
      [name]: value,
    }));
  }

  function validate() {
    if (!form.full_name.trim()) {
      return "Full name is required.";
    }

    if (!form.email.includes("@")) {
      return "Valid email is required.";
    }

    if (form.phone.trim().length < 7) {
      return "Phone must be at least 7 characters.";
    }

    return "";
  }

  // Add-customer flow uses the inline left-side form (unchanged).
  async function submit(e) {
    e.preventDefault();

    if (!isAdmin) {
      return setMsg({
        type: "error",
        text: "Viewer users cannot create customers.",
      });
    }

    const err = validate();
    if (err) return setMsg({ type: "error", text: err });

    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      address: form.address || null,
    };

    try {
      await api.post("/customers", payload);
      setMsg({ type: "success", text: "Customer added." });

      setForm(empty);

      load(page);
      onChange?.();
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    }
  }

  function openEdit(c) {
    if (!isAdmin) return;

    setEditTarget({
      id: c.id,
      full_name: c.full_name,
      email: c.email,
      phone: c.phone,
      address: c.address || "",
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
    if (!t.full_name.trim()) {
      return "Full name is required.";
    }
    if (!t.email.includes("@")) {
      return "Valid email is required.";
    }
    if (t.phone.trim().length < 7) {
      return "Phone must be at least 7 characters.";
    }
    return "";
  }

  async function saveEdit(e) {
    e.preventDefault();

    if (!isAdmin || !editTarget) return;

    const err = validateEdit(editTarget);
    if (err) return setMsg({ type: "error", text: err });

    const payload = {
      full_name: editTarget.full_name,
      email: editTarget.email,
      phone: editTarget.phone,
      address: editTarget.address || null,
    };

    try {
      setSaving(true);

      await api.put(`/customers/${editTarget.id}`, payload);

      setMsg({ type: "success", text: "Customer updated." });
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
        text: "Viewer users cannot delete customers.",
      });
    }

    setConfirmDeleteId(id);
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return;

    try {
      setDeleting(true);

      await api.delete(`/customers/${confirmDeleteId}`);

      setMsg({ type: "success", text: "Customer deleted." });
      setConfirmDeleteId(null);

      load(page);
      onChange?.();
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    } finally {
      setDeleting(false);
    }
  }

  const deleteTargetCustomer = data.items.find(
    (c) => c.id === confirmDeleteId
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
            You are logged in as <strong>viewer</strong>. You can view
            customers, but create, update, and delete actions are disabled.
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
                <h3>➕ Add Customer</h3>
                <p>Email must be unique across all customers.</p>
              </div>
            </div>

            <label>
              Full Name
              <input
                name="full_name"
                value={form.full_name}
                onChange={change}
                placeholder="e.g. Priya Sharma"
                required
              />
            </label>

            <label>
              Email Address
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={change}
                placeholder="priya@example.com"
                required
              />
            </label>

            <label>
              Phone Number
              <input
                name="phone"
                value={form.phone}
                onChange={change}
                placeholder="9876543210"
                required
              />
            </label>

            <label>
              Address (optional)
              <textarea
                name="address"
                value={form.address}
                onChange={change}
                placeholder="Street, City, State…"
                style={{ minHeight: 60 }}
              />
            </label>

            <div className="btn-group">
              <button className="btn btn-primary" type="submit">
                Add Customer
              </button>
            </div>
          </form>
        )}

        <div className="card card-pad">
          <div className="toolbar">
            <div>
              <h3 style={{ fontWeight: 800, marginBottom: 2 }}>Customers</h3>

              <p style={{ fontSize: "0.8rem", color: "var(--ink3)" }}>
                {data.total} registered customers
              </p>
            </div>

            <input
              style={{ maxWidth: 260 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone…"
            />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {data.items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.full_name}</strong>
                    </td>

                    <td>{c.email}</td>
                    <td>{c.phone}</td>

                    <td
                      style={{
                        color: "var(--ink3)",
                        fontSize: "0.8rem",
                      }}
                    >
                      {c.address || "—"}
                    </td>

                    <td
                      style={{
                        color: "var(--ink3)",
                        fontSize: "0.78rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(c.created_at).toLocaleDateString("en-IN")}
                    </td>

                    <td>
                      {isAdmin ? (
                        <div className="btn-group">
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            type="button"
                            onClick={() => openEdit(c)}
                          >
                            ✏️
                          </button>

                          <button
                            className="btn btn-danger btn-sm btn-icon"
                            type="button"
                            onClick={() => askDelete(c.id)}
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
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <p>No customers found.</p>
                      </div>
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td
                      colSpan={6}
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

      {/* ───────── Edit Customer Modal ───────── */}
      {editTarget && (
        <div className="modal-backdrop" onClick={closeEdit}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={saveEdit} style={{ display: "grid", gap: "1rem" }}>
              <div className="modal-header" style={{ position: "static" }}>
                <div>
                  <h3>✏️ Edit Customer</h3>
                  <p>Update details for "{editTarget.full_name}"</p>
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
                  Full Name
                  <input
                    name="full_name"
                    value={editTarget.full_name}
                    onChange={editChange}
                    required
                  />
                </label>

                <label>
                  Email Address
                  <input
                    name="email"
                    type="email"
                    value={editTarget.email}
                    onChange={editChange}
                    required
                  />
                </label>

                <label>
                  Phone Number
                  <input
                    name="phone"
                    value={editTarget.phone}
                    onChange={editChange}
                    required
                  />
                </label>

                <label>
                  Address (optional)
                  <textarea
                    name="address"
                    value={editTarget.address}
                    onChange={editChange}
                    style={{ minHeight: 60 }}
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

            <h3>Delete this customer?</h3>

            <p>
              {deleteTargetCustomer
                ? `"${deleteTargetCustomer.full_name}" (${deleteTargetCustomer.email}) will be permanently removed. Customers with existing orders cannot be deleted.`
                : "This customer will be permanently removed. Customers with existing orders cannot be deleted."}
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