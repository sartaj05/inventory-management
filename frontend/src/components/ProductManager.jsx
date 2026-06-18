import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api.js";
import Message from "./Message.jsx";

const initialForm = {
  name: "",
  sku: "",
  price: "",
  quantity: "",
};

export default function ProductManager({ onChange }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  async function loadProducts() {
    try {
      const response = await api.get("/products");
      setProducts(response.data);
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validateForm() {
    if (!form.name.trim() || !form.sku.trim()) return "Product name and SKU are required.";
    if (Number(form.price) <= 0) return "Price must be greater than zero.";
    if (Number(form.quantity) < 0) return "Quantity cannot be negative.";
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    const payload = {
      name: form.name,
      sku: form.sku,
      price: Number(form.price),
      quantity: Number(form.quantity),
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        setMessage({ type: "success", text: "Product updated successfully." });
      } else {
        await api.post("/products", payload);
        setMessage({ type: "success", text: "Product added successfully." });
      }
      setForm(initialForm);
      setEditingId(null);
      await loadProducts();
      onChange?.();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  }

  function editProduct(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: product.quantity,
    });
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      setMessage({ type: "success", text: "Product deleted successfully." });
      await loadProducts();
      onChange?.();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Product Management</h2>
          <p>Add, update, and manage stock quantity.</p>
        </div>
      </div>

      <Message type={message.type} text={message.text} />

      <div className="grid-two">
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>{editingId ? "Update Product" : "Add Product"}</h3>
          <label>
            Product Name
            <input name="name" value={form.name} onChange={handleChange} placeholder="Laptop" />
          </label>
          <label>
            SKU / Code
            <input name="sku" value={form.sku} onChange={handleChange} placeholder="LAP-001" />
          </label>
          <label>
            Price
            <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} />
          </label>
          <label>
            Quantity
            <input name="quantity" type="number" min="0" value={form.quantity} onChange={handleChange} />
          </label>
          <div className="button-row">
            <button className="primary" type="submit">{editingId ? "Update" : "Add"}</button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(initialForm); }}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="card">
          <h3>Product List</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>₹{Number(product.price).toFixed(2)}</td>
                    <td>{product.quantity}</td>
                    <td className="actions">
                      <button onClick={() => editProduct(product)}>Edit</button>
                      <button className="danger" onClick={() => deleteProduct(product.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {!products.length && (
                  <tr><td colSpan="5" className="empty">No products found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
