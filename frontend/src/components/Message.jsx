import React from "react";

export default function Message({ type = "info", text, onClose }) {
  if (!text) return null;
  const cls = { success: "msg-success", error: "msg-error", info: "msg-info", warn: "msg-warn" }[type] || "msg-info";
  const icon = { success: "✓", error: "✕", info: "ℹ", warn: "⚠" }[type] || "ℹ";
  return (
    <div className={`msg ${cls}`} style={{ marginBottom: "1rem" }}>
      <span>{icon}</span>
      <span style={{ flex: 1 }}>{text}</span>
      {onClose && (
        <button className="btn-ghost btn-icon" onClick={onClose} style={{ padding: "0 0.25rem", marginLeft: "auto" }}>
          ✕
        </button>
      )}
    </div>
  );
}
