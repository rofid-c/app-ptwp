"use client";

import React, { useState } from "react";
import { X, FileSpreadsheet, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { exportDuesToExcel } from "@/services/excelService";

export default function ExcelExportModal({
  isOpen,
  onClose,
  members = [],
  period = "September 2026",
  settings = {},
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);

      await exportDuesToExcel({
        members,
        period,
        city: settings.city || "Gunung Sugih",
        treasurerName: settings.treasurerName || "Wulan Febrianti, A.Md",
        treasurerTitle: settings.treasurerTitle || "Bendahara Kantor",
        institution: settings.institution || "PENGADILAN AGAMA GUNUNG SUGIH",
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1400);
    } catch (err) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat mengekspor Excel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px" }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <FileSpreadsheet size={22} color="var(--primary-700)" />
            <span>Export Berkas Excel Resmi (.xlsx)</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && (
            <div style={{ padding: "12px 16px", background: "var(--status-danger-bg)", color: "var(--status-danger)", borderRadius: "var(--radius-md)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{ padding: "12px 16px", background: "var(--status-success-bg)", color: "var(--status-success)", borderRadius: "var(--radius-md)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <CheckCircle2 size={18} />
              <span>File Excel berhasil diunduh ke komputer Anda!</span>
            </div>
          )}

          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginBottom: "16px" }}>
            Sistem akan secara otomatis menyusun dan memformat berkas Microsoft Excel persis sesuai tata naskah resmi <strong>PTWP {settings.institution || "Cabang"}</strong>:
          </p>

          <div style={{ background: "var(--bg-app)", borderRadius: "var(--radius-md)", padding: "16px", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-700)", fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              <span>Judul & Periode: IURAN PTWP CABANG {settings.institution || "KANTOR"} ({period})</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-700)", fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              <span>Penomoran panduan kolom baku (1, 2, 9, ... 15, 16)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-700)", fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              <span>Format angka Rupiah akuntansi & border kisi sel rapi</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-700)", fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              <span>Formula dinamis TOTAL =SUM(...) untuk perhitungan otomatis</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-700)", fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              <span>Blok tanda tangan resmi ({settings.city || "Gunung Sugih"}, {settings.treasurerName || "Wulan Febrianti, A.Md"})</span>
            </div>
          </div>

          <div style={{ marginTop: "16px", fontSize: "12px", color: "var(--text-muted)" }}>
            * Berkas berisi total <strong>{members.length} anggota</strong> dengan akumulasi iuran sebesar{" "}
            <strong>
              Rp{" "}
              {new Intl.NumberFormat("id-ID").format(
                members.reduce(
                  (sum, m) =>
                    sum +
                    (Number(m.pusat || 0) +
                      Number(m.daerah || 0) +
                      Number(m.cabang || 0) +
                      Number(m.tournamen || 0)),
                  0
                )
              )}
            </strong>.
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn-excel"
            onClick={handleExport}
            disabled={loading || members.length === 0}
          >
            <Download size={16} />
            <span>{loading ? "Memproses..." : "Unduh File Excel (.xlsx)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
