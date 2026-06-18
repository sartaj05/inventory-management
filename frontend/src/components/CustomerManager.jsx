import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api.js";
import Message from "./Message.jsx";

const initialForm = {
  full_name: "",
  email: "",
  phone: "",
};

export default function CustomerManager({ onChange }) {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState({ type: "", text: "" });

  async function loadCustomers() {
    try {
      const response = await api.get("/customers");
      setCustomers(response.data);
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validateForm() {
    if (!form.full_name.trim()) return "Full name is required.";
    if (!form.email.includes("@")) return "Valid email is required.";
    if (form.phone.trim().length < 7) return "Valid phone number is required.";
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    try {
      await api.post("/customers", form);
      setMessage({ type: "success", text: "Customer added successfully." });
      setForm(initialForm);
      await loadCustomers();
      onChange?.();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  }

  async function deleteCustomer(id) {
    if (!confirm("Delete this customer?")) return;
    try {
      await api.delete(`/customers/${id}`);
      setMessage({ type: "success", text: "Customer deleted successfully." });
      await loadCustomers();
      onChange?.();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Customer Management</h2>
          <p>Create and manage customer records.</p>
        </div>
      </div>

      <Message type={message.type} text={message.text} />

      <div className="grid-two">
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>Add Customer</h3>
          <label>
            Full Name
            <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Rahul Sharma" />
          </label>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="rahul@example.com" />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" />
          </label>
          <button className="primary" type="submit">Add Customer</button>
        </form>

        <div className="card">
          <h3>Customer List</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.full_name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>
                      <button className="danger" onClick={() => deleteCustomer(customer.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {!customers.length && (
                  <tr><td colSpan="4" className="empty">No customers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
