"use client";

import React, { useState } from "react";
import { Plus, Trash2, Calendar, Tag, FileText, X, AlertCircle } from "lucide-react";

export default function DuesExpenseView({
  period = "September 2026",
  expenses = [],
  onDeleteExpense,
  isAdmin = true,
  formatRupiah = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`,
}) {
  const totalPeriodExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <>
      {/* 1. TAMPILAN DESKTOP: TABEL REALISASI BELANJA IDENTIK DENGAN DuesTable */}
      <div className="stitch-table-card">
        <div className="table-responsive">
          <table className="stitch-table" id="ptwp-expense-table">
            <thead>
              <tr>
                <th style={{ width: "48px", textAlign: "center" }}>No</th>
                <th style={{ minWidth: "220px" }}>Uraian Pengeluaran</th>
                <th style={{ minWidth: "150px" }}>Kategori</th>
                <th style={{ width: "120px", textAlign: "center" }}>Tanggal</th>
                <th className="text-right" style={{ minWidth: "140px", textAlign: "right" }}>Pengeluaran (Rp)</th>
                <th style={{ minWidth: "180px" }}>Keterangan / Catatan</th>
                {isAdmin && <th style={{ width: "80px", textAlign: "center" }}>Aksi</th>}
              </tr>
            </thead>

            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 6}
                    style={{
                      textAlign: "center",
                      padding: "36px 20px",
                      color: "var(--text-muted, #64748b)",
                      fontSize: "13px",
                    }}
                  >
                    Belum ada catatan belanja pada periode ini.
                  </td>
                </tr>
              ) : (
                expenses.map((exp, idx) => {
                  const uraianText = exp.uraian || exp.description || "-";
                  const ketText = exp.ket || "";
                  const isSetoran =
                    (exp.category || "").includes("Pusat") || (exp.category || "").includes("Daerah");

                  return (
                    <tr
                      key={exp.id || idx}
                      className="stitch-table-row"
                    >
                      <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "12.5px" }}>
                        {idx + 1}
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "13px" }}>
                          {uraianText}
                        </div>
                      </td>

                      <td>
                        <span className={isSetoran ? "badge-cat-setoran" : "badge-cat-operasional"}>
                          {exp.category || "Operasional"}
                        </span>
                      </td>

                      <td style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
                        {exp.date || "-"}
                      </td>

                      <td
                        className="font-mono-num text-right"
                        style={{
                          textAlign: "right",
                          fontWeight: 700,
                          color: "var(--money-out)",
                          fontSize: "13.5px",
                        }}
                      >
                        - {formatRupiah(exp.amount)}
                      </td>

                      <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {ketText || "-"}
                      </td>

                      {isAdmin && (
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => onDeleteExpense && onDeleteExpense(exp.id, exp)}
                            title="Hapus catatan pengeluaran ini"
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#ef4444",
                              cursor: "pointer",
                              padding: "4px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>

            {expenses.length > 0 && (
              <tfoot>
                <tr className="expense-table-total-row">
                  <td colSpan={4} style={{ padding: "14px 16px", fontWeight: 800, color: "var(--text-primary)" }}>
                    JUMLAH TOTAL PENGELUARAN BULAN INI:
                  </td>
                  <td
                    className="font-mono-num"
                    style={{
                      padding: "14px 16px",
                      textAlign: "right",
                      fontWeight: 900,
                      fontSize: "14px",
                      color: "var(--money-out)",
                    }}
                  >
                    {formatRupiah(totalPeriodExpenses)}
                  </td>
                  <td colSpan={isAdmin ? 2 : 1}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 2. TAMPILAN MOBILE: KARTU PENGELUARAN */}
      <div className="mobile-cards-feed" style={{ marginTop: "12px" }}>
        {expenses.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "24px 16px",
              color: "var(--text-muted, #64748b)",
              fontSize: "13px",
              background: "var(--bg-surface, #ffffff)",
              borderRadius: "var(--radius-lg, 12px)",
              border: "1px solid var(--border-light, #e2e8f0)",
            }}
          >
            Belum ada catatan belanja pada periode ini.
          </div>
        ) : (
          expenses.map((exp, idx) => (
            <div
              key={exp.id || idx}
              style={{
                background: "var(--bg-surface, #ffffff)",
                borderRadius: "12px",
                border: "1px solid var(--border-light, #e2e8f0)",
                padding: "14px",
                marginBottom: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-main)" }}>
                    {exp.uraian || exp.description || "-"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {exp.date || "-"} • <span style={{ color: "#c2410c", fontWeight: 600 }}>{exp.category || "Operasional"}</span>
                  </div>
                </div>
                <div className="font-mono-num" style={{ fontWeight: 800, color: "#dc2626", fontSize: "14px" }}>
                  - {formatRupiah(exp.amount)}
                </div>
              </div>
              {exp.ket && (
                <div style={{ fontSize: "12px", color: "var(--text-muted)", background: "var(--bg-app, #f8fafc)", padding: "6px 10px", borderRadius: "6px" }}>
                  {exp.ket}
                </div>
              )}
              {isAdmin && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => onDeleteExpense && onDeleteExpense(exp.id, exp)}
                    style={{
                      border: "1px solid #fecaca",
                      background: "#fff5f5",
                      color: "#ef4444",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Hapus</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}