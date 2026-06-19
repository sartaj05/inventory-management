import React, { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api.js";
import Message from "./Message.jsx";
import Pagination from "./Pagination.jsx";

const empty = { full_name: "", email: "", phone: "", address: "" };

export default function CustomerManager({ onChange }) {
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 20, pages: 1 });
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  async function load(p = page) {
    try {
      setLoading(true);
      const res = await api.get("/customers", {
        params: { ...(search ? { q: search } : {}), page: p, limit: 20 },
      });
      setData(res.data);
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1); }, 280);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { load(page); }, [page]);

  function change(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    if (!form.full_name.trim()) return "Full name is required.";
    if (!form.email.includes("@")) return "Valid email is required.";
    if (form.phone.trim().length < 7) return "Phone must be at least 7 characters.";
    return "";
  }

  async function submit(e) {
    e.preventDefault();
    const err = validate();
    if (err) return setMsg({ type: "error", text: err });

    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      address: form.address || null,
    };

    try {
      if (editId) {
        await api.put(`/customers/${editId}`, payload);
        setMsg({ type: "success", text: "Customer updated." });
      } else {
        await api.post("/customers", payload);
        setMsg({ type: "success", text: "Customer added." });
      }
      setForm(empty); setEditId(null);
      load(page); onChange?.();
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    }
  }

  function startEdit(c) {
    setEditId(c.id);
    setForm({ full_name: c.full_name, email: c.email, phone: c.phone, address: c.address || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() { setEditId(null); setForm(empty); }

  async function del(id) {
    if (!confirm("Delete this customer? Customers with orders cannot be deleted.")) return;
    try {
      await api.delete(`/customers/${id}`);
      setMsg({ type: "success", text: "Customer deleted." });
      load(page); onChange?.();
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    }
  }

  return (
    <div>
      <Message type={msg.type} text={msg.text} onClose={() => setMsg({ type: "", text: "" })} />
      <div className="manager-layout">

        {/* Form */}
        <form className="card card-pad" onSubmit={submit} style={{ display: "grid", gap: "1rem" }}>
          <div className="card-header">
            <div>
              <h3>{editId ? "✏️ Edit Customer" : "➕ Add Customer"}</h3>
              <p>Email must be unique across all customers.</p>
            </div>
          </div>

          <label>Full Name
            <input name="full_name" value={form.full_name} onChange={change} placeholder="e.g. Priya Sharma" required />
          </label>

          <label>Email Address
            <input name="email" type="email" value={form.email} onChange={change} placeholder="priya@example.com" required />
          </label>

          <label>Phone Number
            <input name="phone" value={form.phone} onChange={change} placeholder="9876543210" required />
          </label>

          <label>Address (optional)
            <textarea name="address" value={form.address} onChange={change} placeholder="Street, City, State…" style={{ minHeight: 60 }} />
          </label>

          <div className="btn-group">
            <button className="btn btn-primary" type="submit">{editId ? "Update Customer" : "Add Customer"}</button>
            {editId && <button className="btn btn-secondary" type="button" onClick={cancelEdit}>Cancel</button>}
          </div>
        </form>

        {/* Table */}
        <div className="card card-pad">
          <div className="toolbar">
            <div>
              <h3 style={{ fontWeight: 800, marginBottom: 2 }}>Customers</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--ink3)" }}>{data.total} registered customers</p>
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
                    <td><strong>{c.full_name}</strong></td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td style={{ color: "var(--ink3)", fontSize: "0.8rem" }}>{c.address || "—"}</td>
                    <td style={{ color: "var(--ink3)", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                      {new Date(c.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => startEdit(c)}>✏️</button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(c.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!data.items.length && !loading && (
                  <tr><td colSpan={6}>
                    <div className="empty-state"><div className="empty-icon">👥</div><p>No customers found.</p></div>
                  </td></tr>
                )}
                {loading && (
                  <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--ink3)", padding: "2rem" }}>Loading…</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination {...data} onPageChange={(p) => setPage(p)} />
        </div>
      </div>
    </div>
  );
}
