"use client";

import React, { useState, useEffect } from "react";
import { X, Settings, Save, Server, MessageSquare } from "lucide-react";
import { API_CONFIG } from "@/services/storageService";

export default function SettingsModal({
  isOpen,
  onClose,
  settings = {},
  onSaveSettings,
  enableWhatsApp,
  onToggleWhatsApp,
}) {
  const [formData, setFormData] = useState({
    institution: settings.institution || "PENGADILAN AGAMA GUNUNG SUGIH",
    city: settings.city || "Gunung Sugih",
    treasurerName: settings.treasurerName || "Wulan Febrianti, A.Md",
    treasurerTitle: settings.treasurerTitle || "Bendahara Kantor",
    chairmanName: settings.chairmanName || "Dr. H. Al Fitri",
    chairmanTitle: settings.chairmanTitle || "Ketua Cabang PTWP",
  });

  const [useRemote, setUseRemote] = useState(API_CONFIG.USE_REMOTE_API);
  const [apiUrl, setApiUrl] = useState(API_CONFIG.API_BASE_URL);

  useEffect(() => {
    if (settings && isOpen) {
      setFormData({
        institution: settings.institution || "PENGADILAN AGAMA GUNUNG SUGIH",
        city: settings.city || "Gunung Sugih",
        treasurerName: settings.treasurerName || "Wulan Febrianti, A.Md",
        treasurerTitle: settings.treasurerTitle || "Bendahara Kantor",
        chairmanName: settings.chairmanName || "Dr. H. Al Fitri",
        chairmanTitle: settings.chairmanTitle || "Ketua Cabang PTWP",
      });
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;


  const handleSubmit = (e) => {
    e.preventDefault();
    API_CONFIG.USE_REMOTE_API = useRemote;
    API_CONFIG.API_BASE_URL = apiUrl;

    onSaveSettings && onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px" }}>
        <div className="modal-header">
          <div className="modal-title">
            <Settings size={22} color="var(--primary-700)" />
            <span>Pengaturan Satker & Penandatangan</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                Nama Satuan Kerja / Pengadilan
              </label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                style={{ width: "100%", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: "13px" }}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Kota / Titimangsa Laporan
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  style={{ width: "100%", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: "13px" }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Jabatan Penandatangan
                </label>
                <input
                  type="text"
                  value={formData.treasurerTitle}
                  onChange={(e) => setFormData({ ...formData, treasurerTitle: e.target.value })}
                  style={{ width: "100%", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: "13px" }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                Nama Bendahara Resmi (beserta Gelar)
              </label>
              <input
                type="text"
                value={formData.treasurerName}
                onChange={(e) => setFormData({ ...formData, treasurerName: e.target.value })}
                style={{ width: "100%", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: "13px" }}
                required
              />
              <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                Nama ini akan dicetak di bagian tanda tangan bawah pada ekspor Excel dan cetakan fisik.
              </span>
            </div>

            {/* Opsi Fitur WhatsApp Reminder */}
            <div style={{ background: "var(--bg-app)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <MessageSquare size={20} color="#16a34a" />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                      1-Click WhatsApp Reminder
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                      Tampilkan tombol kirim pengingat iuran langsung ke WhatsApp pegawai
                    </div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={enableWhatsApp}
                  onChange={(e) => onToggleWhatsApp && onToggleWhatsApp(e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--primary-700)" }}
                />
              </div>
            </div>

            {/* Opsi Kesiapan Database / Backend API */}
            <div style={{ background: "var(--bg-app)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "var(--primary-700)", fontWeight: 700, fontSize: "13px" }}>
                <Server size={18} />
                <span>Konektivitas Database / API Backend</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "10px" }}>
                Saat ini data disimpan secara offline-ready di <strong>Client Storage</strong>. Anda dapat mengaktifkan koneksi ke API server eksternal kapan saja di bawah ini:
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <input
                  type="checkbox"
                  id="toggle-remote-api"
                  checked={useRemote}
                  onChange={(e) => setUseRemote(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--primary-700)" }}
                />
                <label htmlFor="toggle-remote-api" style={{ fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}>
                  Gunakan Endpoint API Backend Terpusat
                </label>
              </div>

              {useRemote && (
                <div style={{ marginTop: "8px" }}>
                  <input
                    type="text"
                    placeholder="Contoh: https://api.pengadilan.go.id/ptwp atau /api"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    style={{ width: "100%", border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)", padding: "6px 10px", fontSize: "12px", background: "#ffffff" }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
