import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* HEADER */}
      <header className="landing-header">
        <div className="logo">IMS</div>

        <nav>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
        </nav>

        <div className="actions">
          <button onClick={() => navigate("/auth")} className="btn-outline">
            Login
          </button>
          <button onClick={() => navigate("/auth")} className="btn-primary">
            Get Started
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-left">
          <h1>
            Manage Your Inventory <span>Like a Pro</span>
          </h1>

          <p>
            Track stock, manage orders, monitor customers and gain insights —
            all from one powerful dashboard.
          </p>

          <div className="hero-actions">
            <button
              onClick={() => navigate("/auth")}
              className="btn-primary big"
            >
              Start Free →
            </button>

            <button className="btn-ghost">Live Demo</button>
          </div>

          <div className="hero-stats">
            <div>
              <strong>10K+</strong>
              <span>Products Managed</span>
            </div>
            <div>
              <strong>5K+</strong>
              <span>Orders Processed</span>
            </div>
            <div>
              <strong>99.9%</strong>
              <span>Uptime</span>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="dashboard-mock">
            <div className="mock-header">📊 Dashboard</div>
            <div className="mock-grid">
              <div className="mock-card small"></div>
              <div className="mock-card small"></div>
              <div className="mock-card large"></div>
            </div>
          </div>
        </div>
      </section>

     <section className="features">
  <h2>Everything you need</h2>
  <p className="section-sub">
    Built for modern businesses that demand control and clarity.
  </p>

  <div className="features-grid">
    <div className="feature-card">📦 Smart Inventory</div>
    <div className="feature-card">🧾 Order Tracking</div>
    <div className="feature-card">👥 Customer Management</div>
    <div className="feature-card">📊 Analytics</div>
  </div>
</section>
      {/* FOOTER */}
      <footer className="landing-footer">
        <p>© 2026 IMS. Built with actual effort (finally).</p>
      </footer>
    </div>
  );
}
