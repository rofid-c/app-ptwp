"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Save, Sparkles } from "lucide-react";

export default function MemberFormModal({
  isOpen,
  onClose,
  onSave,
  editMember = null,
}) {
  const [formData, setFormData] = useState({
    name: "",
    title: "STAF",
    category: "Staf",
    pusat: 5000,
    daerah: 5000,
    cabang: 5000,
    tournamen: 1750,
  });

  useEffect(() => {
    if (editMember) {
      setFormData({
        name: editMember.name || "",
        title: editMember.title || "STAF",
        category: editMember.category || "Staf",
        pusat: editMember.pusat ?? 5000,
        daerah: editMember.daerah ?? 5000,
        cabang: editMember.cabang ?? 5000,
        tournamen: editMember.tournamen ?? 1750,
      });
    } else {
      setFormData({
        name: "",
        title: "STAF",
        category: "Staf",
        pusat: 5000,
        daerah: 5000,
        cabang: 5000,
        tournamen: 1750,
      });
    }
  }, [editMember, isOpen]);

  if (!isOpen) return null;

  // Isi otomatis berdasarkan standar tarif iuran resmi PTWP PA Gunung Sugih
  const handleApplyPreset = (jabatan) => {
    const j = jabatan.toUpperCase();
    if (j.includes("KETUA") && !j.includes("WAKIL")) {
      setFormData((prev) => ({ ...prev, title: "Ketua", category: "Hakim", pusat: 20000, daerah: 20000, cabang: 20000, tournamen: 20000 }));
    } else if (j.includes("WAKIL")) {
      setFormData((prev) => ({ ...prev, title: "Wakil Ketua", category: "Hakim", pusat: 20000, daerah: 20000, cabang: 20000, tournamen: 17500 }));
    } else if (j.includes("HAKIM")) {
      setFormData((prev) => ({ ...prev, title: "Hakim", category: "Hakim", pusat: 20000, daerah: 20000, cabang: 20000, tournamen: 15000 }));
    } else if (j.includes("PANITERA") || j.includes("SEKRETARIS")) {
      setFormData((prev) => ({ ...prev, title: jabatan, category: "Kepaniteraan", pusat: 20000, daerah: 20000, cabang: 20000, tournamen: 10000 }));
    } else if (j.includes("PANMUD") || j.includes("KASUB") || j.includes("JABFUNG")) {
      setFormData((prev) => ({ ...prev, title: jabatan, category: "Kesekretariatan", pusat: 15000, daerah: 15000, cabang: 15000, tournamen: 7500 }));
    } else if (j.includes("PP")) {
      setFormData((prev) => ({ ...prev, title: "PP", category: "Kepaniteraan", pusat: 10000, daerah: 10000, cabang: 10000, tournamen: 4000 }));
    } else if (j.includes("JS") || j.includes("JSP")) {
      setFormData((prev) => ({ ...prev, title: jabatan, category: "Kepaniteraan", pusat: 10000, daerah: 10000, cabang: 10000, tournamen: 3500 }));
    } else {
      setFormData((prev) => ({ ...prev, title: "STAF", category: "Staf", pusat: 5000, daerah: 5000, cabang: 5000, tournamen: 1750 }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    onSave &&
      onSave({
        ...formData,
        pusat: Number(formData.pusat),
        daerah: Number(formData.daerah),
        cabang: Number(formData.cabang),
        tournamen: Number(formData.tournamen),
      });

    onClose();
  };

  const rowTotal =
    Number(formData.pusat || 0) +
    Number(formData.daerah || 0) +
    Number(formData.cabang || 0) +
    Number(formData.tournamen || 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
        <div className="modal-header">
          <div className="modal-title">
            <UserPlus size={22} color="var(--primary-700)" />
            <span>{editMember ? "Edit Data Anggota" : "Tambah Anggota Pegawai Baru"}</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                Nama Lengkap & Gelar
              </label>
              <input
                type="text"
                placeholder="Contoh: Ertika Urie, S.H.I., M.H.I."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: "100%", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: "13.5px" }}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Jabatan
                </label>
                <select
                  value={formData.title}
                  onChange={(e) => handleApplyPreset(e.target.value)}
                  className="period-select"
                  style={{ width: "100%" }}
                >
                  <option value="Ketua">Ketua</option>
                  <option value="Wakil Ketua">Wakil Ketua</option>
                  <option value="Hakim">Hakim</option>
                  <option value="Panitera">Panitera</option>
                  <option value="Sekretaris">Sekretaris</option>
                  <option value="Panmud">Panmud</option>
                  <option value="Kasub">Kasub</option>
                  <option value="JabFung">JabFung</option>
                  <option value="PP">PP (Panitera Pengganti)</option>
                  <option value="JS">JS (Jurusita)</option>
                  <option value="JSP">JSP (Jurusita Pengganti)</option>
                  <option value="STAF">STAF / Pelaksana</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="period-select"
                  style={{ width: "100%" }}
                >
                  <option value="Hakim">Hakim</option>
                  <option value="Kepaniteraan">Kepaniteraan</option>
                  <option value="Kesekretariatan">Kesekretariatan</option>
                  <option value="Staf">Staf</option>
                </select>
              </div>
            </div>

            {/* Nominal Iuran 4 Kolom */}
            <div style={{ background: "var(--bg-app)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Besaran Iuran Bulanan (Rp)
                </span>
                <span style={{ fontSize: "11px", color: "var(--primary-700)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                  <Sparkles size={13} />
                  <span>Tarif Terisi Otomatis</span>
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>Iuran Pusat</label>
                  <input
                    type="number"
                    value={formData.pusat}
                    onChange={(e) => setFormData({ ...formData, pusat: e.target.value })}
                    className="search-input font-mono-num"
                    style={{ border: "1px solid var(--border-light)", padding: "6px 10px", borderRadius: "var(--radius-sm)", width: "100%", background: "#ffffff" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>Iuran Daerah</label>
                  <input
                    type="number"
                    value={formData.daerah}
                    onChange={(e) => setFormData({ ...formData, daerah: e.target.value })}
                    className="search-input font-mono-num"
                    style={{ border: "1px solid var(--border-light)", padding: "6px 10px", borderRadius: "var(--radius-sm)", width: "100%", background: "#ffffff" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>Iuran Cabang</label>
                  <input
                    type="number"
                    value={formData.cabang}
                    onChange={(e) => setFormData({ ...formData, cabang: e.target.value })}
                    className="search-input font-mono-num"
                    style={{ border: "1px solid var(--border-light)", padding: "6px 10px", borderRadius: "var(--radius-sm)", width: "100%", background: "#ffffff" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>Iuran Turnamen</label>
                  <input
                    type="number"
                    value={formData.tournamen}
                    onChange={(e) => setFormData({ ...formData, tournamen: e.target.value })}
                    className="search-input font-mono-num"
                    style={{ border: "1px solid var(--border-light)", padding: "6px 10px", borderRadius: "var(--radius-sm)", width: "100%", background: "#ffffff" }}
                  />
                </div>
              </div>

              <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px dashed var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>Total Iuran:</span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--primary-700)" }} className="font-mono-num">
                  Rp {new Intl.NumberFormat("id-ID").format(rowTotal)}
                </span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Simpan Anggota</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
