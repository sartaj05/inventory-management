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
            Get Started Free
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">✓ Trusted by 2,400+ businesses</div>

          <h1>Manage Your Inventory <span>Like a Pro</span></h1>

          <p className="hero-subtitle">
            Real-time stock tracking, smart ordering, and powerful analytics — 
            built for businesses that want to stop losing money on inventory mistakes.
          </p>

          <div className="hero-actions">
            <button onClick={() => navigate("/auth")} className="btn-primary big">
              Start Free Trial →
            </button>
            <button className="btn-ghost">Watch 2-min Demo</button>
          </div>

          <div className="trust-badges">
            <span>No credit card required</span>
            <span>14-day free trial</span>
            <span>Cancel anytime</span>
          </div>

          <div className="hero-stats">
            <div><strong>10K+</strong><span>Products</span></div>
            <div><strong>5K+</strong><span>Orders/month</span></div>
            <div><strong>99.9%</strong><span>Uptime</span></div>
            <div><strong>4.9/5</strong><span>Rating</span></div>
          </div>
        </div>

        {/* CLEAN & PROFESSIONAL DASHBOARD MOCK */}
        <div className="hero-visual">
          <div className="dashboard-mock">
            <div className="mock-header">📊 Live Dashboard</div>

            <div className="mock-main-stats">
              <div className="mock-stat">
                <div className="mock-value">1,284</div>
                <div className="mock-label">Total Products</div>
              </div>
              <div className="mock-stat warning">
                <div className="mock-value">7</div>
                <div className="mock-label">Low Stock</div>
              </div>
              <div className="mock-stat">
                <div className="mock-value">23</div>
                <div className="mock-label">Pending Orders</div>
              </div>
            </div>

            <div className="mock-grid">
              <div className="mock-card">
                <div className="mock-card-label">Stock Value</div>
                <div className="mock-card-big">$84,392</div>
              </div>
              <div className="mock-card">
                <div className="mock-card-label">Today's Sales</div>
                <div className="mock-card-big">$2,841</div>
              </div>
            </div>

            <div className="mock-top-products">
              <div className="mock-card-label">Top Products This Month</div>
              <div className="mock-product-row">
                <span>Wireless Headphones</span>
                <span className="sold">142 sold</span>
              </div>
              <div className="mock-product-row">
                <span>Office Chair</span>
                <span className="sold">89 sold</span>
              </div>
            </div>

            <div className="mock-alert">
              ⚠ Low Stock Alert: 7 items need immediate attention
            </div>
          </div>
        </div>
      </section>

      {/* Trust Logos */}
      <section className="trust-logos">
        <p className="trust-heading">Trusted by fast-growing teams</p>
        <div className="logos">Acme Corp • TechFlow • RetailPro • SupplyHub • NovaStore</div>
      </section>

      {/* Features */}
      <section id="features" className="features-section">
        <h2>Everything your inventory needs</h2>
        <p className="section-sub">Powerful tools that save time and reduce costly errors.</p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feat-icon">📦</div>
            <h3>Smart Inventory</h3>
            <p>Real-time tracking, automatic reordering & low-stock alerts</p>
          </div>
          <div className="feature-card">
            <div className="feat-icon">🧾</div>
            <h3>Order Management</h3>
            <p>Complete order lifecycle from quote to delivery</p>
          </div>
          <div className="feature-card">
            <div className="feat-icon">👥</div>
            <h3>Customer CRM</h3>
            <p>Rich profiles, history & insights</p>
          </div>
          <div className="feature-card">
            <div className="feat-icon">📊</div>
            <h3>Analytics</h3>
            <p>Beautiful dashboards and exportable reports</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <h2>Ready to run a tighter operation?</h2>
        <p>Join thousands of businesses using IMS daily.</p>
        <button onClick={() => navigate("/auth")} className="btn-primary big">
          Start Your Free Trial Now
        </button>
      </section>

      <footer className="landing-footer">
        <p>© 2026 IMS • Built with ❤️</p>
      </footer>
    </div>
  );
}