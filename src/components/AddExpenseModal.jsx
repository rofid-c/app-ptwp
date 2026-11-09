"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Receipt, Calendar, Tag, FileText, DollarSign } from "lucide-react";

export default function AddExpenseModal({
  isOpen = false,
  onClose,
  period = "September 2026",
  onAddExpense,
}) {
  const [mounted, setMounted] = useState(false);
  const [newUraian, setNewUraian] = useState("");
  const [newCategory, setNewCategory] = useState("Operasional Lapangan");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newKet, setNewKet] = useState("");

  useEffect(() => {
    setMounted(true);
    setNewDate(new Date().toISOString().split("T")[0]);
  }, []);

  // Keyboard shortcut ESC untuk menutup modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose && onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newUraian.trim() || !newAmount || Number(newAmount) <= 0) {
      alert("Silakan lengkapi uraian dan nominal pengeluaran yang valid.");
      return;
    }

    const entry = {
      id: `exp_${Date.now()}`,
      uraian: newUraian.trim(),
      description: newUraian.trim() + (newKet.trim() ? ` - ${newKet.trim()}` : ""),
      category: newCategory,
      amount: Number(newAmount),
      date: newDate || new Date().toISOString().split("T")[0],
      ket: newKet.trim(),
      type: "out",
      period: period,
      source: "rekap_keluar",
    };

    onAddExpense && onAddExpense(entry);
    onClose && onClose();

    // Reset Form
    setNewUraian("");
    setNewAmount("");
    setNewKet("");
    setNewCategory("Operasional Lapangan");
  };

  const modalNode = (
    <div
      className="ptwp-modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="add-expense-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-surface, #ffffff)",
          border: "1px solid var(--border-light, #e2e8f0)",
          borderRadius: "22px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
          animation: "modalFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-light, #e2e8f0)",
            background: "var(--bg-surface, #ffffff)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "rgba(220, 38, 38, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Receipt size={20} color="#dc2626" />
            </div>
            <div>
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: 800,
                  margin: 0,
                  color: "var(--text-primary, #0f172a)",
                  lineHeight: 1.25,
                }}
              >
                Catat Pengeluaran Baru
              </h3>
              <p
                style={{
                  margin: "3px 0 0 0",
                  fontSize: "12px",
                  color: "var(--text-muted, #64748b)",
                }}
              >
                Periode {period} • Rekap Iuran Keluar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--text-muted, #64748b)",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            title="Tutup (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
          {/* Uraian Pengeluaran */}
          <div style={{ marginBottom: "14px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-primary, #334155)",
                marginBottom: "6px",
              }}
            >
              Uraian Pengeluaran / Belanja <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Contoh: Beli Bola Tenis Dunlop 1 Slop"
              value={newUraian}
              onChange={(e) => setNewUraian(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1.5px solid var(--border-light, #cbd5e1)",
                background: "var(--bg-surface, #ffffff)",
                color: "var(--text-primary, #0f172a)",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s ease",
              }}
            />
          </div>

          {/* Kategori Belanja */}
          <div style={{ marginBottom: "14px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-primary, #334155)",
                marginBottom: "6px",
              }}
            >
              Kategori Belanja
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1.5px solid var(--border-light, #cbd5e1)",
                background: "var(--bg-surface, #ffffff)",
                color: "var(--text-primary, #0f172a)",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
                cursor: "pointer",
              }}
            >
              <option value="Operasional Lapangan">Operasional Lapangan</option>
              <option value="Setoran Wajib Pusat">Setoran Wajib Pusat</option>
              <option value="Setoran Wajib Daerah">Setoran Wajib Daerah</option>
              <option value="Konsumsi">Konsumsi</option>
              <option value="Pemeliharaan Lapangan">Pemeliharaan Lapangan</option>
              <option value="Kegiatan & Turnamen">Kegiatan & Turnamen</option>
              <option value="ATK & Cetak">ATK & Cetak</option>
              <option value="Sarana & Prasarana">Sarana & Prasarana</option>
              <option value="Transport & Akomodasi">Transport & Akomodasi</option>
              <option value="Lain-lain">Lain-lain</option>
            </select>
          </div>

          {/* Jumlah & Tanggal Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--text-primary, #334155)",
                  marginBottom: "6px",
                }}
              >
                Jumlah (Rp) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="Contoh: 150000"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid var(--border-light, #cbd5e1)",
                  background: "var(--bg-surface, #ffffff)",
                  color: "var(--text-primary, #0f172a)",
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--text-primary, #334155)",
                  marginBottom: "6px",
                }}
              >
                Tanggal
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid var(--border-light, #cbd5e1)",
                  background: "var(--bg-surface, #ffffff)",
                  color: "var(--text-primary, #0f172a)",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Keterangan */}
          <div style={{ marginBottom: "22px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-primary, #334155)",
                marginBottom: "6px",
              }}
            >
              Keterangan / Catatan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Lapangan Tenis Pemda"
              value={newKet}
              onChange={(e) => setNewKet(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1.5px solid var(--border-light, #cbd5e1)",
                background: "var(--bg-surface, #ffffff)",
                color: "var(--text-primary, #0f172a)",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "10px",
              paddingTop: "6px",
              borderTop: "1px solid var(--border-light, #f1f5f9)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 18px",
                borderRadius: "10px",
                border: "1.5px solid var(--border-light, #cbd5e1)",
                background: "transparent",
                color: "var(--text-muted, #64748b)",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              style={{
                padding: "9px 20px",
                borderRadius: "10px",
                border: "1.5px solid #dc2626",
                background: "#dc2626",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)",
                transition: "all 0.15s ease",
              }}
            >
              + Simpan Pengeluaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

