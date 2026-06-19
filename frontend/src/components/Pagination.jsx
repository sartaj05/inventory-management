import React from "react";

export default function Pagination({ page, pages, total, limit, onPageChange }) {
  if (pages <= 1) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return (
    <div className="pagination">
      <span className="page-info">{start}–{end} of {total}</span>
      <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>← Prev</button>
      <span className="page-info">Page {page} / {pages}</span>
      <button className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>Next →</button>
    </div>
  );
}
