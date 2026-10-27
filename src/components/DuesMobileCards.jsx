"use client";

import React from "react";
import { Check, Clock, Edit2, MessageCircle, Trash2 } from "lucide-react";

export default function DuesMobileCards({
  members = [],
  period = "September 2026",
  settings = {},
  onToggleStatus,
  onEditMember,
  onDeleteMember,
  isAdmin = true,
  enableWhatsAppReminder = false, // Sesuai arahan: jadikan opsi/toggleable
  onOpenImport,
  onOpenAdd,
  onLoadSample,
}) {
  const formatNumber = (num) => {
    return new Intl.NumberFormat("id-ID").format(Number(num || 0));
  };

  const getRoleClass = (title = "") => {
    const t = title.toLowerCase();
    if (t.includes("ketua") || t.includes("hakim")) return "hakim";
    if (t.includes("panitera") || t.includes("panmud") || t.includes("pp") || t.includes("js")) return "panitera";
    if (t.includes("sekretaris") || t.includes("kasub") || t.includes("jabfung")) return "kesekretariatan";
    return "staf";
  };

  const handleSendWhatsApp = (member, total) => {
    const text = encodeURIComponent(
      `Assalamu'alaikum Wr. Wb. Yth. Bapak/Ibu ${member.name},\n\nMengingatkan informasi Iuran PTWP Cabang ${settings.institution || "PA Gunung Sugih"} periode ${period} sebesar Rp ${formatNumber(total)}.\n\nPembayaran dapat diserahkan kepada Bendahara (${settings.treasurerName || "Bendahara Kantor"}).\n\nTerima kasih atas kerja samanya. Salam olahraga! 🎾`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="mobile-cards-feed">
      {members.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
            Data Iuran Periode Ini Masih Kosong
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>
            Impor berkas Excel (.xlsx / .csv) atau tambahkan data anggota baru.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {onOpenImport && (
              <button type="button" className="btn btn-primary" onClick={onOpenImport} style={{ justifyContent: "center" }}>
                <span>Import Excel / CSV</span>
              </button>
            )}
            {onOpenAdd && (
              <button type="button" className="btn btn-outline" onClick={onOpenAdd} style={{ justifyContent: "center" }}>
                <span>Tambah Anggota</span>
              </button>
            )}
            {onLoadSample && (
              <button type="button" className="btn btn-outline btn-sm" onClick={onLoadSample} style={{ justifyContent: "center" }}>
                <span>Muat Template</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        members.map((member, index) => {
          const rowTotal =
            Number(member.pusat || 0) +
            Number(member.daerah || 0) +
            Number(member.cabang || 0) +
            Number(member.tournamen || 0);

          return (
            <div key={member.id || index} className="employee-card">
              {/* Header Kartu: No, Nama, Status */}
              <div className="card-top">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="card-number font-mono-num">#{index + 1}</span>
                  <div>
                    <h3 className="card-name">{member.name}</h3>
                    <div style={{ marginTop: "4px" }}>
                      <span className={`badge-role ${getRoleClass(member.title)}`}>{member.title}</span>
                    </div>
                  </div>
                </div>

                {/* Status Lunas / Belum */}
                <button
                  type="button"
                  className={`status-pill ${member.paid ? "paid" : "unpaid"}`}
                  onClick={() => onToggleStatus && onToggleStatus(member.id)}
                  title="Sentuh untuk ganti status"
                >
                  {member.paid ? (
                    <>
                      <Check size={12} /> Lunas
                    </>
                  ) : (
                    <>
                      <Clock size={12} /> Belum
                    </>
                  )}
                </button>
              </div>

              {/* Grid 2x2 Rincian Iuran */}
              <div className="dues-grid-mobile font-mono-num">
                <div className="due-item">
                  <span className="due-label">Pusat</span>
                  <span className="due-val">Rp {formatNumber(member.pusat)}</span>
                </div>
                <div className="due-item">
                  <span className="due-label">Daerah</span>
                  <span className="due-val">Rp {formatNumber(member.daerah)}</span>
                </div>
                <div className="due-item">
                  <span className="due-label">Cabang</span>
                  <span className="due-val">Rp {formatNumber(member.cabang)}</span>
                </div>
                <div className="due-item">
                  <span className="due-label">Turnamen</span>
                  <span className="due-val">Rp {formatNumber(member.tournamen)}</span>
                </div>
              </div>

              {/* Bagian Bawah: Total & Tombol Aksi */}
              <div className="card-bottom">
                <div className="card-total-box">
                  <span className="card-total-label">Total Iuran</span>
                  <span className="card-total-num font-mono-num">Rp {formatNumber(rowTotal)}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {enableWhatsAppReminder && !member.paid && (
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => handleSendWhatsApp(member, rowTotal)}
                      title="Kirim Pengingat WhatsApp"
                      style={{ color: "#16a34a", padding: "6px 10px" }}
                    >
                      <MessageCircle size={14} />
                      <span>WA</span>
                    </button>
                  )}

                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        className="btn-outline btn-sm"
                        onClick={() => onEditMember && onEditMember(member)}
                        title="Edit Data"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="btn-outline btn-sm"
                        onClick={() => onDeleteMember && onDeleteMember(member.id)}
                        title="Hapus"
                        style={{ color: "var(--status-danger)" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
