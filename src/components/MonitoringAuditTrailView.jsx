"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  History,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  User,
  Clock,
  ArrowRight,
  FileSpreadsheet,
  Wallet,
  FileCheck,
  Settings,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  CheckCircle2,
  Layers,
  Sparkles,
} from "lucide-react";
import { fetchAuditLogs } from "@/services/storageService";
import { PA_BRANCHES } from "@/components/MonitoringCabangView";

// Daftar seluruh modul untuk filter
const AUDIT_MODULES = [
  { id: "ALL", label: "Semua Modul" },
  { id: "Iuran Anggota", label: "Iuran Anggota" },
  { id: "Buku Kas", label: "Buku Kas" },
  { id: "Dokumen Belanja", label: "Dokumen Belanja" },
  { id: "Pengaturan", label: "Pengaturan Satker" },
  { id: "Akun Pengguna", label: "Akun & Keamanan" },
];

export default function MonitoringAuditTrailView({
  selectedBranch = "all",
  onSelectBranch,
  currentUser,
}) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, iuran: 0, kas: 0, docs: 0, today: 0 });
  const [loading, setLoading] = useState(true);
  const [satkerFilter, setSatkerFilter] = useState(selectedBranch === "all" ? "ALL" : selectedBranch);
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDiffs, setExpandedDiffs] = useState({});

  // Sinkronisasi jika branch dari luar berubah
  useEffect(() => {
    if (selectedBranch && selectedBranch !== "all") {
      const match = PA_BRANCHES.find((b) => b.id === selectedBranch);
      if (match) {
        setSatkerFilter(match.name);
      }
    } else {
      setSatkerFilter("ALL");
    }
  }, [selectedBranch]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetchAuditLogs({
        satker: satkerFilter,
        module: moduleFilter,
        search: searchQuery,
        limit: 200,
      });
      if (res && res.success) {
        setLogs(res.data || []);
        setStats(res.stats || { total: 0, iuran: 0, kas: 0, docs: 0, today: 0 });
      }
    } catch (err) {
      console.error("Gagal memuat jejak audit:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [satkerFilter, moduleFilter]);

  // Handle Search dengan enter atau tombol
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadLogs();
  };

  // Toggle detail diff sebelum-sesudah
  const toggleDiff = (id) => {
    setExpandedDiffs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Helper format tanggal Indonesia
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Helper relative time
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return "";
    const now = new Date();
    const past = new Date(dateStr);
    const diffSec = Math.floor((now - past) / 1000);
    if (diffSec < 60) return "Baru saja";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam lalu`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return `${diffDay} hr lalu`;
    return past.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
  };

  // Helper badge warna untuk modul & aksi
  const getActionBadge = (action, module) => {
    const actUpper = String(action || "").toUpperCase();
    if (actUpper.includes("TOGGLE")) {
      return { bg: "#dcfce7", text: "#15803d", label: "STATUS BAYAR" };
    }
    if (actUpper.includes("IMPORT")) {
      return { bg: "#e0f2fe", text: "#0369a1", label: "IMPORT EXCEL" };
    }
    if (actUpper.includes("ADD") || actUpper.includes("UPSERT")) {
      return { bg: "#fef3c7", text: "#b45309", label: "TAMBAH / UBAH" };
    }
    if (actUpper.includes("UPLOAD")) {
      return { bg: "#fef9c3", text: "#a16207", label: "UNGGAH BERKAS" };
    }
    if (actUpper.includes("DELETE")) {
      return { bg: "#fee2e2", text: "#b91c1c", label: "HAPUS DATA" };
    }
    return { bg: "#f1f5f9", text: "#475569", label: actUpper || "LOG" };
  };

  const getModuleIcon = (mod) => {
    switch (mod) {
      case "Iuran Anggota":
        return <FileSpreadsheet size={14} color="#15803d" />;
      case "Buku Kas":
        return <Wallet size={14} color="#0284c7" />;
      case "Dokumen Belanja":
        return <FileCheck size={14} color="#ca8a04" />;
      case "Pengaturan":
        return <Settings size={14} color="#7c3aed" />;
      default:
        return <History size={14} color="#64748b" />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
      {/* 1. HEADER CARD: JUDUL, DESKRIPSI & AKSI */}
      <div
        className="stitch-card"
        style={{
          background: "var(--bg-surface, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: "16px",
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #0f5132 0%, #198754 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(15, 81, 50, 0.25)",
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 style={{ fontSize: "19px", fontWeight: "700", color: "var(--text-main, #0f172a)", margin: 0 }}>
                Jejak Rekam & Audit Trail Terpadu
              </h2>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "3px 8px",
                  borderRadius: "20px",
                  background: "var(--status-success-bg, #dcfce7)",
                  color: "var(--status-success, #16a34a)",
                  letterSpacing: "0.5px",
                }}
              >
                IMMUTABLE LOGS
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-muted, #64748b)", margin: "4px 0 0 0" }}>
              Pengawasan transparansi dan riwayat perubahan data iuran, kas, dan dokumen belanja 14 PA Cabang se-Wilayah PTA Bandar Lampung.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={loadLogs}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 16px",
              borderRadius: "10px",
              border: "1px solid var(--border-color, #cbd5e1)",
              background: "var(--bg-surface, #ffffff)",
              color: "var(--text-main, #1e293b)",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Muat ulang jejak audit terkini"
          >
            <RefreshCw size={15} className={loading ? "spin-animation" : ""} />
            <span>Segarkan</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 16px",
              borderRadius: "10px",
              border: "none",
              background: "var(--primary-700, #0f5132)",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(15, 81, 50, 0.2)",
            }}
            title="Cetak laporan jejak audit"
          >
            <Printer size={15} />
            <span>Cetak Log</span>
          </button>
        </div>
      </div>

      {/* 2. RINGKASAN METRIK AUDIT (5 KARTU) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
        }}
      >
        <div
          className="stitch-card"
          style={{
            background: "var(--bg-surface, #ffffff)",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "14px",
            padding: "16px 20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted, #64748b)" }}>
              Total Log Aktivitas
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "#f1f5f9", color: "#475569" }}>
              <Layers size={16} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-main, #0f172a)", marginTop: "8px" }}>
            {stats.total.toLocaleString("id-ID")}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", marginTop: "4px" }}>
            Terekam permanen di basis data
          </div>
        </div>

        <div
          className="stitch-card"
          style={{
            background: "var(--bg-surface, #ffffff)",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "14px",
            padding: "16px 20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#15803d" }}>
              Aktivitas Iuran
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "#dcfce7", color: "#15803d" }}>
              <FileSpreadsheet size={16} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#15803d", marginTop: "8px" }}>
            {stats.iuran.toLocaleString("id-ID")}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", marginTop: "4px" }}>
            Status bayar, import & anggota
          </div>
        </div>

        <div
          className="stitch-card"
          style={{
            background: "var(--bg-surface, #ffffff)",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "14px",
            padding: "16px 20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#0284c7" }}>
              Mutasi Buku Kas
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "#e0f2fe", color: "#0284c7" }}>
              <Wallet size={16} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#0284c7", marginTop: "8px" }}>
            {stats.kas.toLocaleString("id-ID")}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", marginTop: "4px" }}>
            Penerimaan & pengeluaran kas
          </div>
        </div>

        <div
          className="stitch-card"
          style={{
            background: "var(--bg-surface, #ffffff)",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "14px",
            padding: "16px 20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#ca8a04" }}>
              Dokumen Excel Asli
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "#fef9c3", color: "#ca8a04" }}>
              <FileCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#ca8a04", marginTop: "8px" }}>
            {stats.docs.toLocaleString("id-ID")}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", marginTop: "4px" }}>
            Arsip berkas belanja cabang
          </div>
        </div>

        <div
          className="stitch-card"
          style={{
            background: "var(--bg-surface, #ffffff)",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "14px",
            padding: "16px 20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#7c3aed" }}>
              Aktivitas Hari Ini
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "#ede9fe", color: "#7c3aed" }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#7c3aed", marginTop: "8px" }}>
            {stats.today.toLocaleString("id-ID")}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", marginTop: "4px" }}>
            Perubahan dalam 24 jam terakhir
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR FILTER & PENCARIAN */}
      <div
        className="stitch-card"
        style={{
          background: "var(--bg-surface, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: "14px",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: 1 }}>
          {/* Dropdown Filter Satker */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Building2 size={15} color="var(--text-muted, #64748b)" />
            <select
              value={satkerFilter}
              onChange={(e) => setSatkerFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #cbd5e1)",
                background: "var(--bg-surface, #ffffff)",
                color: "var(--text-main, #0f172a)",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                outline: "none",
                minWidth: "220px",
              }}
            >
              <option value="ALL">🏛️ Seluruh Satuan Kerja (14 PA + PTA)</option>
              <option value="Pengadilan Tinggi Agama Bandar Lampung">🏢 Pengadilan Tinggi Agama Bandar Lampung</option>
              <optgroup label="Pengadilan Agama Cabang:">
                {PA_BRANCHES.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Dropdown Filter Modul */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={15} color="var(--text-muted, #64748b)" />
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #cbd5e1)",
                background: "var(--bg-surface, #ffffff)",
                color: "var(--text-main, #0f172a)",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {AUDIT_MODULES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Input Pencarian */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-color, #cbd5e1)",
              background: "var(--bg-surface, #ffffff)",
              minWidth: "260px",
            }}
          >
            <Search size={14} color="var(--text-muted, #64748b)" />
            <input
              type="text"
              placeholder="Cari aktor, kegiatan, deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                fontSize: "13px",
                width: "100%",
                background: "transparent",
                color: "var(--text-main, #0f172a)",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "none",
              background: "var(--primary-700, #0f5132)",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Cari
          </button>
        </form>
      </div>

      {/* 4. TABEL JEJAK REKAM AUDIT (AUDIT LOGS TABLE) */}
      <div
        className="stitch-card"
        style={{
          background: "var(--bg-surface, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        <div className="table-responsive">
          <table className="stitch-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-surface-elevated, #f8fafc)", borderBottom: "1px solid var(--border-color, #e2e8f0)" }}>
                <th style={{ width: "140px", padding: "12px 16px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted, #64748b)", textAlign: "left" }}>
                  Waktu
                </th>
                <th style={{ minWidth: "180px", padding: "12px 16px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted, #64748b)", textAlign: "left" }}>
                  Satuan Kerja
                </th>
                <th style={{ minWidth: "150px", padding: "12px 16px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted, #64748b)", textAlign: "left" }}>
                  Aktor / Pengguna
                </th>
                <th style={{ width: "150px", padding: "12px 16px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted, #64748b)", textAlign: "left" }}>
                  Modul & Aksi
                </th>
                <th style={{ minWidth: "260px", padding: "12px 16px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted, #64748b)", textAlign: "left" }}>
                  Uraian Perubahan Data
                </th>
                <th style={{ width: "130px", padding: "12px 16px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted, #64748b)", textAlign: "center" }}>
                  Nilai Diff
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted, #64748b)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                      <RefreshCw size={24} className="spin-animation" color="#0f5132" />
                      <span style={{ fontSize: "13px" }}>Memuat riwayat jejak audit dari basis data...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "50px 20px", color: "var(--text-muted, #64748b)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                      <AlertCircle size={32} color="#94a3b8" />
                      <span style={{ fontSize: "14px", fontWeight: "600" }}>Belum ada log audit yang sesuai filter</span>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                        Coba sesuaikan filter Satker, Modul, atau kata kunci pencarian Anda.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((item, idx) => {
                  const badge = getActionBadge(item.action, item.module);
                  const isExpanded = Boolean(expandedDiffs[item.id]);
                  const hasDiff = item.oldValue !== null || item.newValue !== null;

                  return (
                    <React.Fragment key={item.id || idx}>
                      <tr
                        style={{
                          borderBottom: "1px solid var(--border-color, #e2e8f0)",
                          transition: "background 0.1s ease",
                        }}
                        className="stitch-table-row"
                      >
                        {/* 1. Waktu */}
                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-main, #0f172a)" }}>
                            {formatDateTime(item.createdAt)}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", marginTop: "2px" }}>
                            {getRelativeTime(item.createdAt)}
                          </div>
                        </td>

                        {/* 2. Satker */}
                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Building2 size={13} color="var(--primary-700, #0f5132)" />
                            <span style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main, #0f172a)" }}>
                              {item.satker}
                            </span>
                          </div>
                          {item.period && (
                            <span
                              style={{
                                display: "inline-block",
                                marginTop: "4px",
                                fontSize: "10.5px",
                                padding: "2px 7px",
                                borderRadius: "4px",
                                background: "#f1f5f9",
                                color: "#475569",
                              }}
                            >
                              Periode: {item.period}
                            </span>
                          )}
                        </td>

                        {/* 3. Aktor */}
                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <User size={13} color="var(--text-muted, #64748b)" />
                            <span style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main, #0f172a)" }}>
                              {item.userName}
                            </span>
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", marginTop: "2px" }}>
                            {item.userRole}
                          </div>
                        </td>

                        {/* 4. Modul & Aksi */}
                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
                            {getModuleIcon(item.module)}
                            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-main, #0f172a)" }}>
                              {item.module}
                            </span>
                          </div>
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: "10px",
                              fontWeight: "700",
                              padding: "2px 7px",
                              borderRadius: "6px",
                              background: badge.bg,
                              color: badge.text,
                              letterSpacing: "0.3px",
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* 5. Deskripsi */}
                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          <div style={{ fontSize: "13px", color: "var(--text-main, #0f172a)", lineHeight: "1.4" }}>
                            {item.description}
                          </div>
                          {item.ipAddress && (
                            <div style={{ fontSize: "10.5px", color: "var(--text-muted, #94a3b8)", marginTop: "4px" }}>
                              IP: {item.ipAddress} • Ref ID: {item.entityId || "-"}
                            </div>
                          )}
                        </td>

                        {/* 6. Nilai Diff (Tombol Expand) */}
                        <td style={{ padding: "14px 16px", verticalAlign: "top", textAlign: "center" }}>
                          {hasDiff ? (
                            <button
                              type="button"
                              onClick={() => toggleDiff(item.id)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 9px",
                                borderRadius: "6px",
                                border: "1px solid var(--border-color, #cbd5e1)",
                                background: isExpanded ? "var(--primary-50, #f0f7f4)" : "#ffffff",
                                color: isExpanded ? "var(--primary-700, #0f5132)" : "var(--text-muted, #475569)",
                                fontSize: "11px",
                                fontWeight: "600",
                                cursor: "pointer",
                              }}
                            >
                              <span>{isExpanded ? "Tutup" : "Perubahan"}</span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          ) : (
                            <span style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)" }}>-</span>
                          )}
                        </td>
                      </tr>

                      {/* Baris Expandable Diff Nilai Lama vs Nilai Baru */}
                      {isExpanded && hasDiff && (
                        <tr style={{ background: "var(--bg-surface-elevated, #f8fafc)", borderBottom: "1px solid var(--border-color, #e2e8f0)" }}>
                          <td colSpan={6} style={{ padding: "12px 24px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                                flexWrap: "wrap",
                                fontSize: "12px",
                              }}
                            >
                              {/* Kolom Nilai Sebelum */}
                              <div
                                style={{
                                  flex: 1,
                                  minWidth: "240px",
                                  padding: "10px 14px",
                                  borderRadius: "8px",
                                  background: "#fee2e2",
                                  border: "1px solid #fca5a5",
                                }}
                              >
                                <div style={{ fontWeight: "700", color: "#991b1b", marginBottom: "4px" }}>
                                  Nilai Sebelum Perubahan:
                                </div>
                                <pre
                                  style={{
                                    margin: 0,
                                    fontSize: "11.5px",
                                    color: "#7f1d1d",
                                    fontFamily: "monospace",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-all",
                                  }}
                                >
                                  {item.oldValue ? JSON.stringify(item.oldValue, null, 2) : "Data Baru (Tidak Ada Nilai Lama)"}
                                </pre>
                              </div>

                              <ArrowRight size={20} color="var(--text-muted, #64748b)" />

                              {/* Kolom Nilai Sesudah */}
                              <div
                                style={{
                                  flex: 1,
                                  minWidth: "240px",
                                  padding: "10px 14px",
                                  borderRadius: "8px",
                                  background: "#dcfce7",
                                  border: "1px solid #86efac",
                                }}
                              >
                                <div style={{ fontWeight: "700", color: "#166534", marginBottom: "4px" }}>
                                  Nilai Sesudah Perubahan:
                                </div>
                                <pre
                                  style={{
                                    margin: 0,
                                    fontSize: "11.5px",
                                    color: "#14532d",
                                    fontFamily: "monospace",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-all",
                                  }}
                                >
                                  {item.newValue ? JSON.stringify(item.newValue, null, 2) : "Dihapus (Data Kosong)"}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
