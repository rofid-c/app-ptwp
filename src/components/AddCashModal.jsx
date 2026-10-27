"use client";

import React, { useState } from "react";
import { X, ArrowDownLeft, ArrowUpRight, DollarSign, Calendar, Tag, FileText } from "lucide-react";

export default function AddCashModal({ isOpen, onClose, onAddEntry }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState("out"); // "in" | "out"
  const [category, setCategory] = useState("Operasional Lapangan");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() || !amount || Number(amount) <= 0) {
      alert("Silakan lengkapi uraian dan nominal transaksi.");
      return;
    }

    onAddEntry &&
      onAddEntry({
        date,
        type,
        category,
        description: description.trim(),
        amount: Number(amount),
      });

    // Reset form
    setDescription("");
    setAmount("");
    onClose && onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
              Catat Mutasi Kas Baru
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              Pencatatan transaksi perbendaharaan kas cabang
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} title="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Tipe Transaksi: Kas Masuk vs Kas Keluar */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                Jenis Transaksi
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setType("out")}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: `1.5px solid ${type === "out" ? "var(--status-danger)" : "var(--border-light)"}`,
                    background: type === "out" ? "var(--status-danger-bg)" : "var(--bg-app)",
                    color: type === "out" ? "var(--status-danger)" : "var(--text-secondary)",
                    fontWeight: 700,
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer",
                    transition: "all 150ms",
                  }}
                >
                  <ArrowUpRight size={16} />
                  <span>Kas Keluar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType("in")}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: `1.5px solid ${type === "in" ? "var(--status-success)" : "var(--border-light)"}`,
                    background: type === "in" ? "var(--status-success-bg)" : "var(--bg-app)",
                    color: type === "in" ? "var(--status-success)" : "var(--text-secondary)",
                    fontWeight: 700,
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer",
                    transition: "all 150ms",
                  }}
                >
                  <ArrowDownLeft size={16} />
                  <span>Kas Masuk</span>
                </button>
              </div>
            </div>

            {/* Tanggal & Kategori */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                  Tanggal
                </label>
                <input
                  type="date"
                  className="search-input"
                  style={{ border: "1px solid var(--border-light)", padding: "8px 10px", borderRadius: "8px", width: "100%", fontSize: "13px" }}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                  Kategori
                </label>
                <select
                  className="period-select"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", fontSize: "13px" }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Operasional Lapangan">Operasional Lapangan</option>
                  <option value="Perlengkapan Bola">Perlengkapan / Bola Tenis</option>
                  <option value="Turnamen / Kontingen">Turnamen / Kontingen</option>
                  <option value="Konsumsi Latihan">Konsumsi Latihan</option>
                  <option value="Iuran Anggota">Iuran Anggota</option>
                  <option value="Donasi Sukarela">Donasi Sukarela</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            {/* Uraian Keterangan */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                Uraian / Keterangan Transaksi
              </label>
              <input
                type="text"
                placeholder="Contoh: Beli 3 Slop Bola Dunlop Fort"
                className="search-input"
                style={{ border: "1px solid var(--border-light)", padding: "8px 12px", borderRadius: "8px", width: "100%", fontSize: "13px" }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Nominal (Rupiah) */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                Nominal (Rp)
              </label>
              <input
                type="number"
                placeholder="Contoh: 350000"
                className="search-input font-mono-num"
                style={{ border: "1px solid var(--border-light)", padding: "8px 12px", borderRadius: "8px", width: "100%", fontSize: "14px", fontWeight: 700 }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                required
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer" style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-light)" }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                background: type === "out" ? "var(--status-danger)" : "#0f5132",
                borderColor: "transparent",
              }}
            >
              Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
