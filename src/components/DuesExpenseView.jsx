"use client";

import React, { useState } from "react";
import { Plus, Trash2, Calendar, Tag, FileText, X, AlertCircle } from "lucide-react";

export default function DuesExpenseView({
  period = "September 2026",
  expenses = [],
  onDeleteExpense,
  isAdmin = true,
  formatRupiah = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`,
  isAddModalOpen = false,
  setIsAddModalOpen,
  onAddExpense,
}) {
  // Modal local state
  const [newUraian, setNewUraian] = useState("");
  const [newCategory, setNewCategory] = useState("Operasional Lapangan");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newKet, setNewKet] = useState("");

  const totalPeriodExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const handleSubmitNewExpense = (e) => {
    e.preventDefault();
    if (!newUraian.trim() || !newAmount) return;

    const entry = {
      id: `exp_${Date.now()}`,
      uraian: newUraian.trim(),
      description: newUraian.trim() + (newKet.trim() ? ` - ${newKet.trim()}` : ""),
      category: newCategory,
      amount: Number(newAmount),
      date: newDate,
      ket: newKet.trim(),
      type: "out",
      period: period,
      source: "rekap_keluar",
    };

    onAddExpense && onAddExpense(entry);
    setIsAddModalOpen && setIsAddModalOpen(false);
    setNewUraian("");
    setNewAmount("");
    setNewKet("");
  };

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

      {/* 3. MODAL CATAT PENGELUARAN BARU */}
      {isAddModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  Catat Pengeluaran Baru
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                  Periode {period}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitNewExpense}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Uraian Pengeluaran / Belanja <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli Bola Tenis Dunlop 1 Slop"
                  value={newUraian}
                  onChange={(e) => setNewUraian(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Kategori Belanja
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "13px",
                    outline: "none",
                    background: "#ffffff",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="Operasional Lapangan">Operasional Lapangan</option>
                  <option value="Setoran Wajib Pusat">Setoran Wajib Pusat</option>
                  <option value="Setoran Wajib Daerah">Setoran Wajib Daerah</option>
                  <option value="Konsumsi">Konsumsi</option>
                  <option value="Pemeliharaan Lapangan">Pemeliharaan Lapangan</option>
                  <option value="Kegiatan & Turnamen">Kegiatan & Turnamen</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Jumlah (Rp) <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 150000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Keterangan / Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Lapangan Tenis Pemda"
                  value={newKet}
                  onChange={(e) => setNewKet(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "8px",
                    border: "1.5px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#64748b",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "9px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#dc2626",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}