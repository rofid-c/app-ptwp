"use client";

import React, { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Calendar,
  Sparkles,
  Layers,
  CheckSquare,
  Square,
  ChevronRight,
} from "lucide-react";
import { parseExcelFile } from "@/services/excelService";
import LockedBlurOverlay from "./LockedBlurOverlay";

export default function ExcelImportModal({
  isOpen,
  onClose,
  onImportSuccess,
  period = "September 2026",
  isLocked = false,
  onLockedClick,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [isMultiSheet, setIsMultiSheet] = useState(false);
  const [multiSheets, setMultiSheets] = useState([]);
  const [isMatrixCashbook, setIsMatrixCashbook] = useState(false);
  const [matrixMonths, setMatrixMonths] = useState([]);
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);
  const [targetYear, setTargetYear] = useState("2026");

  // Single sheet states
  const [singleData, setSingleData] = useState([]);
  const [singlePeriod, setSinglePeriod] = useState(period);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (selectedFile) => {
    try {
      setLoading(true);
      setError(null);
      setFile(selectedFile);

      const result = await parseExcelFile(selectedFile, period);

      const detectedYr = result.detectedYear || (period.match(/\b(20\d{2})\b/) || [])[1] || "2026";
      setTargetYear(detectedYr);

      if (result.isMatrixCashbook && Array.isArray(result.matrixMonths) && result.matrixMonths.length > 0) {
        setIsMatrixCashbook(true);
        setIsMultiSheet(false);
        setMatrixMonths(result.matrixMonths.map((m) => ({ ...m, selected: true })));
      } else if (result.isMultiSheet && result.sheets && result.sheets.length > 1) {
        setIsMatrixCashbook(false);
        setIsMultiSheet(true);
        const initialSheets = result.sheets.map((s) => ({
          ...s,
          selected: true,
          year: detectedYr,
          period: `${s.monthName} ${detectedYr}`,
        }));
        setMultiSheets(initialSheets);
        const septIdx = initialSheets.findIndex((s) => s.monthName.toLowerCase() === "september");
        setActivePreviewIdx(septIdx !== -1 ? septIdx : initialSheets.length - 1);
      } else {
        setIsMatrixCashbook(false);
        setIsMultiSheet(false);
        setSingleData(result.members || []);
        const p = result.detectedPeriod || period;
        setSinglePeriod(p);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Gagal memproses berkas Excel / CSV. Pastikan kolom memuat Nama dan Jabatan.");
      setFile(null);
      setMultiSheets([]);
      setSingleData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelectSheet = (idx) => {
    setMultiSheets((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleSelectAll = (select) => {
    setMultiSheets((prev) => prev.map((s) => ({ ...s, selected: select })));
  };

  const handleYearChange = (newYear) => {
    setTargetYear(newYear);
    if (isMultiSheet) {
      setMultiSheets((prev) =>
        prev.map((s) => ({
          ...s,
          year: newYear,
          period: `${s.monthName} ${newYear}`,
        }))
      );
    }
  };

  // Terapkan Impor
  const handleApply = () => {
    if (isMatrixCashbook) {
      const selected = matrixMonths.filter((m) => m.selected);
      if (selected.length === 0) {
        alert("Pilih minimal 1 bulan untuk diimpor.");
        return;
      }
      if (onImportSuccess) {
        const sept = selected.find((m) => m.period.toLowerCase().includes("september"));
        const target = sept ? sept.period : (selected.find((m) => m.period.toLowerCase() === period.toLowerCase())?.period || selected[selected.length - 1].period);
        onImportSuccess({ type: "matrix_cashbook", months: selected }, target, true, file);
        onClose();
      }
      return;
    }

    if (isMultiSheet) {
      const selected = multiSheets.filter((s) => s.selected);
      if (selected.length === 0) {
        alert("Pilih minimal 1 lembar bulan untuk diimpor.");
        return;
      }

      const payload = selected.map((s) => ({
        period: `${s.monthName} ${targetYear}`,
        members: s.members,
      }));

      const activeSheet = multiSheets[activePreviewIdx] || selected[selected.length - 1];
      const activeTargetPeriod = `${activeSheet.monthName} ${targetYear}`;

      if (onImportSuccess) {
        onImportSuccess(payload, activeTargetPeriod, true, file);
        onClose();
      }
    } else {
      if (singleData.length > 0 && onImportSuccess) {
        onImportSuccess(singleData, singlePeriod, false, file);
        onClose();
      }
    }
  };

  const reset = () => {
    setFile(null);
    setIsMultiSheet(false);
    setIsMatrixCashbook(false);
    setMatrixMonths([]);
    setMultiSheets([]);
    setSingleData([]);
    setError(null);
  };

  const activeSheet = isMultiSheet ? multiSheets[activePreviewIdx] : null;
  const previewRows = isMultiSheet ? (activeSheet ? activeSheet.members : []) : singleData;
  const selectedCount = isMultiSheet ? multiSheets.filter((s) => s.selected).length : 1;
  const selectedMatrixCount = isMatrixCashbook ? matrixMonths.filter((m) => m.selected).length : 0;

  const handleSelectAllMatrix = (val) => {
    setMatrixMonths((prev) => prev.map((m) => ({ ...m, selected: val })));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: isMultiSheet ? "840px" : "740px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Efek Blur + Logo Kunci di Tengah jika Akun PTA / Fitur Terkunci */}
        {isLocked && (
          <LockedBlurOverlay
            onUnlockClick={() => {
              if (onLockedClick) onLockedClick();
            }}
          />
        )}

        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <UploadCloud size={22} color="var(--primary-700)" />
            <span>Import Berkas Excel / CSV Iuran</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ overflowY: "auto", flex: 1 }}>
          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "var(--status-danger-bg)",
                color: "var(--status-danger)",
                borderRadius: "var(--radius-md)",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {!file ? (
            <div>
              <div
                className={`dropzone ${dragActive ? "active" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current && inputRef.current.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleChange}
                  style={{ display: "none" }}
                />
                <FileSpreadsheet className="dropzone-icon" />
                <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                  Tarik file Excel / CSV ke sini atau klik untuk memilih
                </h4>
                <p style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                  Mendukung format <strong>.xlsx</strong> multi-sheet (Januari s.d. Desember), <strong>.xls</strong>, dan <strong>.csv</strong>
                </p>
                <div
                  style={{
                    marginTop: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--primary-100)",
                    color: "var(--primary-700)",
                    padding: "5px 14px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  <Sparkles size={14} />
                  <span>Membaca otomatis seluruh sheet bulanan sekaligus (Januari s.d. September dsb)</span>
                </div>
              </div>

              <div
                style={{
                  marginTop: "16px",
                  background: "var(--bg-app)",
                  borderRadius: "var(--radius-md)",
                  padding: "14px",
                  border: "1px solid var(--border-light)",
                  fontSize: "12.5px",
                  color: "var(--text-secondary)",
                }}
              >
                <strong>Format Kolom yang Dikenali Otomatis:</strong>
                <div style={{ marginTop: "6px", fontFamily: "monospace", color: "var(--primary-700)", fontWeight: 600 }}>
                  NO | NAMA | JABATAN | IURAN PUSAT | IURAN DAERAH | IURAN CABANG | IURAN TOURNAMEN
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* File Info Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--bg-app)",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "16px",
                  border: "1px solid var(--border-light)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FileSpreadsheet size={28} color="var(--primary-700)" />
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-primary)" }}>{file.name}</div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                      {(file.size / 1024).toFixed(1)} KB •{" "}
                      {isMultiSheet
                        ? `${multiSheets.length} lembar bulan terdeteksi`
                        : `${singleData.length} baris anggota terdeteksi`}
                    </div>
                  </div>
                </div>

                <button type="button" className="btn btn-outline btn-sm" onClick={reset}>
                  <RefreshCw size={13} />
                  <span>Ganti File</span>
                </button>
              </div>

              {/* TAMPILAN BERKAS REKAPITULASI KAS TRIWULAN (PA GUNUNG SUGIH) */}
              {isMatrixCashbook ? (
                <div>
                  <div
                    style={{
                      background: "linear-gradient(90deg, #eff6ff 0%, #f0fdf4 100%)",
                      border: "1.5px solid #93c5fd",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Layers size={22} color="#1d4ed8" />
                      <div>
                        <div style={{ fontSize: "14.5px", fontWeight: 800, color: "#1e3a8a" }}>
                          📊 Terdeteksi: Berkas Laporan Rekap Saldo Kas Triwulan (PA Gunung Sugih)
                        </div>
                        <div style={{ fontSize: "12px", color: "#475569" }}>
                          Ditemukan {matrixMonths.length} periode bulan lengkap dengan Saldo Awal, Penerimaan Iuran, dan Rincian Pos Belanja Pengeluaran.
                        </div>
                      </div>
                    </div>

                    {/* Quick Selection Buttons untuk Matrix */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #93c5fd" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#1e3a8a" }}>
                        Centang bulan yang ingin diimpor ({selectedMatrixCount}/{matrixMonths.length} dipilih):
                      </span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: "11px", padding: "2px 8px", height: "26px", borderColor: "#93c5fd", color: "#1d4ed8" }}
                          onClick={() => handleSelectAllMatrix(true)}
                        >
                          Pilih Semua
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: "11px", padding: "2px 8px", height: "26px", borderColor: "#93c5fd", color: "#1d4ed8" }}
                          onClick={() => handleSelectAllMatrix(false)}
                        >
                          Batal Semua
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Daftar Bulan yang Ditemukan */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "360px", overflowY: "auto", paddingRight: "4px" }}>
                    {matrixMonths.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: m.selected ? "#ffffff" : "#f8fafc",
                          border: `1.5px solid ${m.selected ? "#16a34a" : "#cbd5e1"}`,
                          borderRadius: "12px",
                          padding: "14px 16px",
                          boxShadow: m.selected ? "0 4px 12px rgba(22, 163, 74, 0.08)" : "none",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>
                            <input
                              type="checkbox"
                              checked={m.selected}
                              onChange={() => {
                                setMatrixMonths((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, selected: !item.selected } : item))
                                );
                              }}
                              style={{ width: "16px", height: "16px", cursor: "pointer" }}
                            />
                            <span>{m.period}</span>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>({m.label})</span>
                          </label>

                          <span style={{ fontSize: "11.5px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", background: "#fee2e2", color: "#dc2626" }}>
                            {m.expenses.length} Pos Belanja
                          </span>
                        </div>

                        {/* Rincian Angka */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px", background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", fontSize: "12px" }}>
                          <div>
                            <span style={{ color: "#64748b", display: "block" }}>Saldo Awal:</span>
                            <strong style={{ color: "#334155" }}>Rp {Number(m.saldoAwal || 0).toLocaleString("id-ID")}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#64748b", display: "block" }}>Iuran Masuk:</span>
                            <strong style={{ color: "#16a34a" }}>+ Rp {Number(m.iuranMasuk || 0).toLocaleString("id-ID")}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#64748b", display: "block" }}>Total Belanja:</span>
                            <strong style={{ color: "#dc2626" }}>- Rp {Number(m.totalPengeluaran || 0).toLocaleString("id-ID")}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#64748b", display: "block" }}>Saldo Akhir:</span>
                            <strong style={{ color: "#0284c7" }}>Rp {Number(m.saldoAkhir || 0).toLocaleString("id-ID")}</strong>
                          </div>
                        </div>

                        {/* List item belanja singkat */}
                        {m.expenses.length > 0 && (
                          <div style={{ marginTop: "8px", fontSize: "11px", color: "#64748b" }}>
                            <strong>Rincian Belanja:</strong> {m.expenses.map((e) => `${e.uraian} (Rp ${Number(e.amount).toLocaleString("id-ID")})`).join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : isMultiSheet ? (
                <div>
                  {/* Banner Multi-Sheet */}
                  <div
                    style={{
                      background: "linear-gradient(90deg, #ecfdf5 0%, #f0fdf4 100%)",
                      border: "1.5px solid #a7f3d0",
                      borderRadius: "var(--radius-md)",
                      padding: "14px 16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "10px",
                        marginBottom: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Layers size={20} color="var(--primary-700)" />
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--primary-800)" }}>
                            ✨ Terdeteksi {multiSheets.length} Lembar Periode Bulan dalam Excel!
                          </div>
                          <div style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                            Setiap lembar bulan akan otomatis disimpan ke periode masing-masing di Rekap Iuran & Buku Kas.
                          </div>
                        </div>
                      </div>

                      {/* Kontrol Tahun Periode */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", padding: "4px 10px", borderRadius: "var(--radius-md)", border: "1px solid #d1fae5" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary-800)" }}>Tahun Periode:</span>
                        <input
                          type="number"
                          min="2020"
                          max="2035"
                          value={targetYear}
                          onChange={(e) => handleYearChange(e.target.value)}
                          style={{
                            width: "72px",
                            padding: "3px 6px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-light)",
                            fontWeight: 800,
                            fontSize: "13px",
                            textAlign: "center",
                            color: "var(--primary-900)",
                          }}
                        />
                      </div>
                    </div>

                    {/* Quick Selection Buttons */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #a7f3d0" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                        Centang lembar bulan yang ingin diimpor ({selectedCount}/{multiSheets.length} dipilih):
                      </span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: "11px", padding: "2px 8px", height: "26px" }}
                          onClick={() => handleSelectAll(true)}
                        >
                          Pilih Semua
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: "11px", padding: "2px 8px", height: "26px" }}
                          onClick={() => handleSelectAll(false)}
                        >
                          Batal Semua
                        </button>
                      </div>
                    </div>

                    {/* Grid Lembar Bulan */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                        gap: "8px",
                        marginTop: "10px",
                        maxHeight: "180px",
                        overflowY: "auto",
                        padding: "4px",
                      }}
                    >
                      {multiSheets.map((s, idx) => {
                        const isActive = activePreviewIdx === idx;
                        return (
                          <div
                            key={idx}
                            onClick={() => setActivePreviewIdx(idx)}
                            style={{
                              padding: "8px 10px",
                              borderRadius: "var(--radius-md)",
                              border: isActive ? "2px solid var(--primary-600)" : "1px solid var(--border-light)",
                              background: isActive ? "var(--primary-50)" : "#ffffff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSelectSheet(idx);
                                }}
                                style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                              >
                                {s.selected ? (
                                  <CheckSquare size={16} color="var(--primary-700)" />
                                ) : (
                                  <Square size={16} color="var(--text-muted)" />
                                )}
                              </div>
                              <div style={{ overflow: "hidden" }}>
                                <div
                                  style={{
                                    fontSize: "12.5px",
                                    fontWeight: 700,
                                    color: s.selected ? "var(--text-primary)" : "var(--text-muted)",
                                    whiteSpace: "nowrap",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {s.monthName} {targetYear}
                                </div>
                                <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                                  {s.count} Pegawai
                                </div>
                              </div>
                            </div>
                            {isActive && <ChevronRight size={14} color="var(--primary-700)" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* TAMPILAN BERKAS SINGLE SHEET */
                <div
                  style={{
                    background: "linear-gradient(90deg, #dcfce7 0%, #f0fdf4 100%)",
                    border: "1.5px solid var(--status-success-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "14px 16px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Calendar size={20} color="var(--status-success)" />
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--status-success)" }}>
                        Periode Bulan Target
                      </div>
                      <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)" }}>
                        {singlePeriod}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Ubah Periode:</span>
                    <input
                      type="text"
                      value={singlePeriod}
                      onChange={(e) => setSinglePeriod(e.target.value)}
                      style={{
                        border: "1px solid var(--border-light)",
                        borderRadius: "var(--radius-sm)",
                        padding: "4px 8px",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        background: "#ffffff",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Pratinjau Tabel Hasil Parsing */}
              {previewRows.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                      Pratinjau Data {isMultiSheet && activeSheet ? `(${activeSheet.monthName} ${targetYear})` : ""}:
                    </h4>
                    <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                      Menampilkan 5 dari {previewRows.length} pegawai
                    </span>
                  </div>

                  <div style={{ maxHeight: "190px", overflowY: "auto", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)" }}>
                    <table className="data-table font-mono-num" style={{ fontSize: "11.5px" }}>
                      <thead>
                        <tr>
                          <th>NO</th>
                          <th>NAMA</th>
                          <th>JABATAN</th>
                          <th className="text-right">PUSAT</th>
                          <th className="text-right">DAERAH</th>
                          <th className="text-right">CABANG</th>
                          <th className="text-right">TOUR</th>
                          <th className="text-right">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.slice(0, 5).map((row, idx) => {
                          const rowTotal =
                            (Number(row.pusat) || 0) +
                            (Number(row.daerah) || 0) +
                            (Number(row.cabang) || 0) +
                            (Number(row.tournamen) || 0);
                          return (
                            <tr key={idx}>
                              <td className="text-center">{row.no || idx + 1}</td>
                              <td style={{ fontWeight: 600 }}>{row.name}</td>
                              <td>{row.title}</td>
                              <td className="text-right">{new Intl.NumberFormat("id-ID").format(row.pusat)}</td>
                              <td className="text-right">{new Intl.NumberFormat("id-ID").format(row.daerah)}</td>
                              <td className="text-right">{new Intl.NumberFormat("id-ID").format(row.cabang)}</td>
                              <td className="text-right">{new Intl.NumberFormat("id-ID").format(row.tournamen)}</td>
                              <td className="text-right" style={{ fontWeight: 700, color: "var(--primary-700)" }}>
                                {new Intl.NumberFormat("id-ID").format(rowTotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: "1px solid var(--border-light)", padding: "14px 20px" }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApply}
            disabled={
              (isMatrixCashbook && selectedMatrixCount === 0) ||
              (!isMatrixCashbook && !isMultiSheet && singleData.length === 0) ||
              (isMultiSheet && selectedCount === 0) ||
              loading
            }
            style={{ fontWeight: 700 }}
          >
            <CheckCircle2 size={16} />
            <span>
              {isMatrixCashbook
                ? `Terapkan ${selectedMatrixCount} Bulan Kas & Belanja`
                : isMultiSheet
                ? `Impor Semua ${selectedCount} Bulan Sekaligus`
                : `Terapkan ke Periode ${singlePeriod}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
