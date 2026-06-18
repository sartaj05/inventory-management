import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api.js";
import Message from "./Message.jsx";

const initialItem = { product_id: "", quantity: 1 };

export default function OrderManager({ onChange }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([initialItem]);
  const [message, setMessage] = useState({ type: "", text: "" });

  async function loadData() {
    try {
      const [ordersRes, productsRes, customersRes] = await Promise.all([
        api.get("/orders"),
        api.get("/products"),
        api.get("/customers"),
      ]);
      setOrders(ordersRes.data);
      setProducts(productsRes.data);
      setCustomers(customersRes.data);
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateItem(index, field, value) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addItem() {
    setItems((current) => [...current, initialItem]);
  }

  function removeItem(index) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function validateOrder() {
    if (!customerId) return "Select a customer.";
    for (const item of items) {
      if (!item.product_id) return "Select product for all rows.";
      if (Number(item.quantity) <= 0) return "Quantity must be greater than zero.";
    }
    return "";
  }

  async function createOrder(event) {
    event.preventDefault();

    const validationError = validateOrder();
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    const payload = {
      customer_id: Number(customerId),
      items: items.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
      })),
    };

    try {
      await api.post("/orders", payload);
      setMessage({ type: "success", text: "Order created and inventory updated successfully." });
      setCustomerId("");
      setItems([initialItem]);
      await loadData();
      onChange?.();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  }

  async function deleteOrder(id) {
    if (!confirm("Cancel/delete this order? Stock will be restored.")) return;
    try {
      await api.delete(`/orders/${id}`);
      setMessage({ type: "success", text: "Order cancelled and stock restored." });
      await loadData();
      onChange?.();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Order Management</h2>
          <p>Create orders and automatically reduce inventory.</p>
        </div>
      </div>

      <Message type={message.type} text={message.text} />

      <div className="grid-two">
        <form className="card form-card" onSubmit={createOrder}>
          <h3>Create Order</h3>

          <label>
            Customer
            <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name} — {customer.email}
                </option>
              ))}
            </select>
          </label>

          <div className="order-items">
            <div className="subheader">
              <strong>Order Items</strong>
              <button type="button" onClick={addItem}>+ Add Item</button>
            </div>

            {items.map((item, index) => (
              <div className="item-row" key={index}>
                <select
                  value={item.product_id}
                  onChange={(event) => updateItem(index, "product_id", event.target.value)}
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku}) — Qty {product.quantity}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) => updateItem(index, "quantity", event.target.value)}
                />
                {items.length > 1 && (
                  <button type="button" className="danger" onClick={() => removeItem(index)}>Remove</button>
                )}
              </div>
            ))}
          </div>

          <button className="primary" type="submit">Create Order</button>
        </form>

        <div className="card">
          <h3>Orders</h3>
          <div className="order-list">
            {orders.map((order) => (
              <div className="order-card" key={order.id}>
                <div className="order-top">
                  <div>
                    <strong>Order #{order.id}</strong>
                    <p>{order.customer.full_name} — {order.customer.email}</p>
                  </div>
                  <strong>₹{Number(order.total_amount).toFixed(2)}</strong>
                </div>
                <ul>
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.product.name} × {item.quantity} = ₹{Number(item.line_total).toFixed(2)}
                    </li>
                  ))}
                </ul>
                <button className="danger" onClick={() => deleteOrder(order.id)}>Cancel/Delete</button>
              </div>
            ))}
            {!orders.length && <p className="empty">No orders found.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
