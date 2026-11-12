"use client";

import React from "react";
import { Check, Clock, Edit2, Trash2, MessageCircle, FileText } from "lucide-react";

export default function DuesTable({
  members = [],
  settings = {},
  period = "September 2026",
  onToggleStatus,
  onEditMember,
  onDeleteMember,
  isAdmin = true,
  onOpenImport,
  onOpenAdd,
}) {
  const formatNumber = (num) => {
    return new Intl.NumberFormat("id-ID").format(Number(num || 0));
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  // Hitung penjumlahan kolom total
  const totalPusat = members.reduce((sum, m) => sum + Number(m.pusat || 0), 0);
  const totalDaerah = members.reduce((sum, m) => sum + Number(m.daerah || 0), 0);
  const totalCabang = members.reduce((sum, m) => sum + Number(m.cabang || 0), 0);
  const totalTournamen = members.reduce((sum, m) => sum + Number(m.tournamen || 0), 0);
  const grandTotal = totalPusat + totalDaerah + totalCabang + totalTournamen;

  const paidCount = members.filter((m) => m.paid).length;
  const paidPct = members.length > 0 ? Math.round((paidCount / members.length) * 100) : 0;

  const handleSendWhatsApp = (member, total) => {
    const text = encodeURIComponent(
      `Assalamu'alaikum Wr. Wb. Yth. Bapak/Ibu ${member.name},\n\nMengingatkan informasi Iuran PTWP Cabang ${settings.institution || "PA Gunung Sugih"} periode ${period} sebesar Rp ${formatNumber(total)}.\n\nPembayaran dapat diserahkan kepada Bendahara (${settings.treasurerName || "Bendahara Kantor"}).\n\nTerima kasih atas kerja samanya. Salam olahraga! 🎾`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="stitch-table-card">
      <div className="table-responsive">
        <table className="stitch-table" id="ptwp-dues-table">
          <thead>
            {/* Header Kolom Formal Sesuai Stitch */}
            <tr>
              <th style={{ width: "48px", textAlign: "center" }}>No</th>
              <th style={{ minWidth: "220px" }}>Nama Lengkap</th>
              <th style={{ minWidth: "130px" }}>Jabatan</th>
              <th className="text-right" style={{ minWidth: "100px" }}>Pusat</th>
              <th className="text-right" style={{ minWidth: "100px" }}>Daerah</th>
              <th className="text-right" style={{ minWidth: "100px" }}>Cabang</th>
              <th className="text-right" style={{ minWidth: "100px" }}>Tour</th>
              <th className="text-right" style={{ minWidth: "110px" }}>Total</th>
              <th style={{ width: "110px", textAlign: "center" }}>Status</th>
              {isAdmin && <th style={{ width: "110px", textAlign: "center" }}>Aksi</th>}
            </tr>

          </thead>

          <tbody>
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 10 : 9}
                  style={{
                    textAlign: "center",
                    padding: "36px 20px",
                    color: "var(--text-muted, #64748b)",
                    fontSize: "13px",
                  }}
                >
                  Belum ada data anggota pada periode ini.
                </td>
              </tr>
            ) : (
              members.map((member, index) => {
                const rowTotal =
                  Number(member.pusat || 0) +
                  Number(member.daerah || 0) +
                  Number(member.cabang || 0) +
                  Number(member.tournamen || 0);

                return (
                  <tr key={member.id || index} className="stitch-table-row">
                    <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                      {index + 1}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{member.name}</div>
                    </td>
                    <td>
                      <span style={{ color: "var(--text-muted)", fontSize: "12.5px" }}>{member.title || "-"}</span>
                    </td>
                    <td className="text-right font-mono-num">{formatNumber(member.pusat)}</td>
                    <td className="text-right font-mono-num">{formatNumber(member.daerah)}</td>
                    <td className="text-right font-mono-num">{formatNumber(member.cabang)}</td>
                    <td className="text-right font-mono-num">{formatNumber(member.tournamen)}</td>
                    <td className="text-right font-mono-num" style={{ fontWeight: 700, color: member.paid ? "var(--text-primary)" : "#d97706" }}>
                      {formatNumber(rowTotal)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => onToggleStatus && onToggleStatus(member.id)}
                        className={`stitch-status-pill ${member.paid ? "lunas" : "belum"}`}
                        title="Klik untuk ubah status lunas / belum"
                      >
                        {member.paid ? "Lunas" : "Belum Bayar"}
                      </button>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                          {/* Tombol Edit */}
                          <button
                            type="button"
                            className="stitch-row-action-btn edit"
                            onClick={() => onEditMember && onEditMember(member)}
                            title="Edit Data Anggota"
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Tombol WhatsApp Reminder (jika belum lunas) */}
                          {!member.paid && (
                            <button
                              type="button"
                              className="stitch-row-action-btn wa"
                              onClick={() => handleSendWhatsApp(member, rowTotal)}
                              title="Kirim Pengingat Tagihan WhatsApp"
                            >
                              <MessageCircle size={14} />
                            </button>
                          )}

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            className="stitch-row-action-btn delete"
                            onClick={() => onDeleteMember && onDeleteMember(member.id)}
                            title="Hapus dari Periode Ini"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Baris Total Ringkasan Sesuai Format Resmi Stitch */}
          {members.length > 0 && (
            <tfoot>
              <tr style={{ background: "#0b3b2b", color: "#ffffff" }}>
                <td colSpan={3} style={{ padding: "12px 14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#ffffff" }}>
                  TOTAL ({period.toUpperCase()})
                </td>
                <td className="text-right font-mono-num" style={{ fontWeight: 700, color: "#ffffff" }}>{formatNumber(totalPusat)}</td>
                <td className="text-right font-mono-num" style={{ fontWeight: 700, color: "#ffffff" }}>{formatNumber(totalDaerah)}</td>
                <td className="text-right font-mono-num" style={{ fontWeight: 700, color: "#ffffff" }}>{formatNumber(totalCabang)}</td>
                <td className="text-right font-mono-num" style={{ fontWeight: 700, color: "#ffffff" }}>{formatNumber(totalTournamen)}</td>
                <td className="text-right font-mono-num" style={{ fontWeight: 800, color: "#fef08a", fontSize: "14px" }}>
                  {formatRupiah(grandTotal)}
                </td>
                <td colSpan={isAdmin ? 2 : 1} style={{ textAlign: "center", fontSize: "11px", color: "#86efac", fontWeight: 700 }}>
                  Rekonsiliasi Selesai
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

    </div>
  );
}
