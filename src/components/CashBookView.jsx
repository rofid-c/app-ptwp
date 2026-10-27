"use client";

import React, { useState } from "react";
import { Plus, ArrowDownLeft, ArrowUpRight, Filter, Calendar, Trash2 } from "lucide-react";

export default function CashBookView({ cashbook = [], onAddEntry, onDeleteEntry, isAdmin = true }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "out",
    category: "Operasional",
    description: "",
    amount: "",
  });

  const totalIn = cashbook.filter((c) => c.type === "in").reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalOut = cashbook.filter((c) => c.type === "out").reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const balance = totalIn - totalOut;

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  const filteredEntries = cashbook.filter((c) => {
    if (filterType === "all") return true;
    return c.type === filterType;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newEntry.description || !newEntry.amount) return;

    onAddEntry &&
      onAddEntry({
        ...newEntry,
        amount: Number(newEntry.amount),
      });

    setNewEntry({
      date: new Date().toISOString().split("T")[0],
      type: "out",
      category: "Operasional",
      description: "",
      amount: "",
    });
    setShowAddModal(false);
  };

  return (
    <div>
      {/* 3 Kartu Ringkasan Kas */}
      <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "20px" }}>
        <div className="metric-card success">
          <div className="metric-header">
            <span className="metric-title">Total Kas Masuk</span>
            <div className="metric-icon-box" style={{ background: "var(--status-success-bg)", color: "var(--status-success)" }}>
              <ArrowDownLeft size={20} />
            </div>
          </div>
          <div className="metric-value font-mono-num">{formatRupiah(totalIn)}</div>
          <div className="metric-footer">Termasuk penerimaan iuran anggota riil</div>
        </div>

        <div className="metric-card amber">
          <div className="metric-header">
            <span className="metric-title">Total Kas Keluar</span>
            <div className="metric-icon-box" style={{ background: "var(--status-warning-bg)", color: "var(--status-warning)" }}>
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="metric-value font-mono-num">{formatRupiah(totalOut)}</div>
          <div className="metric-footer">Operasional lapangan, bola, turnamen</div>
        </div>

        <div className="metric-card gold">
          <div className="metric-header">
            <span className="metric-title">Sisa Saldo Kas Cabang</span>
            <div className="metric-icon-box">
              <span style={{ fontWeight: 800, fontSize: "16px" }}>Rp</span>
            </div>
          </div>
          <div className="metric-value font-mono-num">{formatRupiah(balance)}</div>
          <div className="metric-footer">Saldo aktif PTWP PA Gunung Sugih</div>
        </div>
      </div>

      {/* Toolbar Buku Kas */}
      <div className="action-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={16} color="var(--text-muted)" />
          <div className="filter-pills">
            <button
              type="button"
              className={`pill-btn ${filterType === "all" ? "active" : ""}`}
              onClick={() => setFilterType("all")}
            >
              Semua Mutasi ({cashbook.length})
            </button>
            <button
              type="button"
              className={`pill-btn ${filterType === "in" ? "active" : ""}`}
              onClick={() => setFilterType("in")}
            >
              Pemasukan
            </button>
            <button
              type="button"
              className={`pill-btn ${filterType === "out" ? "active" : ""}`}
              onClick={() => setFilterType("out")}
            >
              Pengeluaran
            </button>
          </div>
        </div>

        {isAdmin && (
          <button type="button" className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            <span>Catat Mutasi Kas</span>
          </button>
        )}
      </div>

      {/* Tabel Riwayat Transaksi */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "120px" }}>TANGGAL</th>
                <th style={{ width: "110px", textAlign: "center" }}>JENIS</th>
                <th style={{ width: "150px" }}>KATEGORI</th>
                <th>KETERANGAN / TRANSAKSI</th>
                <th className="text-right" style={{ width: "170px" }}>NOMINAL</th>
                {isAdmin && <th style={{ width: "70px", textAlign: "center" }}>AKSI</th>}
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: "center", padding: "36px 20px", color: "var(--text-muted)", fontSize: "13px" }}>
                    Belum ada catatan mutasi kas.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono-num" style={{ color: "var(--text-secondary)" }}>
                      {item.date}
                    </td>
                    <td className="text-center">
                      <span
                        className={`status-pill ${item.type === "in" ? "paid" : "unpaid"}`}
                        style={{ cursor: "default" }}
                      >
                        {item.type === "in" ? "Masuk" : "Keluar"}
                      </span>
                    </td>
                    <td>
                      <span className="badge-role">{item.category}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span>{item.description}</span>
                        {item.source === "rekap_iuran" && (
                          <span style={{ fontSize: "10.5px", fontWeight: 700, padding: "2px 7px", borderRadius: "99px", background: "#dcfce7", color: "#16a34a" }}>
                            Rekap Iuran
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className="text-right font-mono-num"
                      style={{
                        fontWeight: 800,
                        color: item.type === "in" ? "var(--status-success)" : "var(--status-danger)",
                      }}
                    >
                      {item.type === "in" ? "+" : "-"} {formatRupiah(item.amount)}
                    </td>
                    {isAdmin && (
                      <td className="text-center">
                        {item.source !== "rekap_iuran" ? (
                          <button
                            type="button"
                            onClick={() => onDeleteEntry && onDeleteEntry(item.id)}
                            title="Hapus transaksi kas"
                            style={{
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              color: "#dc2626",
                              padding: "4px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "4px",
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>-</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Transaksi */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <h3 className="modal-title">Catat Mutasi Kas Cabang</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                    Jenis Transaksi
                  </label>
                  <select
                    className="period-select"
                    style={{ width: "100%" }}
                    value={newEntry.type}
                    onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                  >
                    <option value="out">Pengeluaran (Kas Keluar)</option>
                    <option value="in">Pemasukan (Kas Masuk)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                    Tanggal
                  </label>
                  <input
                    type="date"
                    className="search-input"
                    style={{ border: "1px solid var(--border-light)", padding: "8px 12px", borderRadius: "var(--radius-md)", width: "100%" }}
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                    Kategori
                  </label>
                  <select
                    className="period-select"
                    style={{ width: "100%" }}
                    value={newEntry.category}
                    onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                  >
                    <option value="Operasional">Operasional Lapangan</option>
                    <option value="Perlengkapan">Perlengkapan / Bola Tenis</option>
                    <option value="Turnamen">Biaya Kontingen Turnamen</option>
                    <option value="Konsumsi">Konsumsi Latihan</option>
                    <option value="Iuran Anggota">Iuran Anggota</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                    Keterangan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Beli Bola Dunlop Fort 2 Slop"
                    className="search-input"
                    style={{ border: "1px solid var(--border-light)", padding: "8px 12px", borderRadius: "var(--radius-md)", width: "100%" }}
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                    Nominal (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 350000"
                    className="search-input font-mono-num"
                    style={{ border: "1px solid var(--border-light)", padding: "8px 12px", borderRadius: "var(--radius-md)", width: "100%" }}
                    value={newEntry.amount}
                    onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
