"use client";

import React from "react";
import { Trophy, Calendar, MapPin, Users, Award } from "lucide-react";

export default function TournamentView({ tournaments = [] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Banner Semangat Olahraga */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f5132 0%, #062319 100%)",
          color: "#ffffff",
          padding: "24px 28px",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(234, 179, 8, 0.2)", color: "var(--accent-gold)", padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>
            <Trophy size={13} />
            <span>Persatuan Tenis Warga Peradilan</span>
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Cabang Pengadilan Agama Gunung Sugih</h2>
          <p style={{ fontSize: "13px", color: "var(--text-sidebar-muted)", marginTop: "4px" }}>
            "Menjunjung tinggi sportivitas, mempererat silaturahmi, dan menjaga kebugaran aparatur peradilan."
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ textAlign: "center", background: "rgba(255, 255, 255, 0.1)", padding: "10px 18px", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "11px", color: "var(--text-sidebar-muted)", textTransform: "uppercase" }}>Latihan Rutin</div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--accent-gold)" }}>Jumat Pagi</div>
          </div>
          <div style={{ textAlign: "center", background: "rgba(255, 255, 255, 0.1)", padding: "10px 18px", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "11px", color: "var(--text-sidebar-muted)", textTransform: "uppercase" }}>Kontingen Resmi</div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff" }}>4 Kategori</div>
          </div>
        </div>
      </div>

      {/* Grid Turnamen & Agenda */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
        {tournaments.map((t) => (
          <div
            key={t.id}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
              padding: "22px",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
              <span className={`badge-role ${t.category === "Latihan" ? "panitera" : "hakim"}`} style={{ fontSize: "11.5px" }}>
                {t.category}
              </span>
              <span className={`status-pill ${t.status === "Rutin" ? "paid" : "unpaid"}`} style={{ cursor: "default" }}>
                {t.status}
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" }}>{t.name}</h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px", color: "var(--text-secondary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={15} color="var(--primary-700)" />
                <span>{t.date}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={15} color="var(--primary-700)" />
                <span>{t.location}</span>
              </div>
            </div>

            {t.delegates && t.delegates.length > 0 && (
              <div style={{ marginTop: "6px", borderTop: "1px dashed var(--border-light)", paddingTop: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                  Susunan Atlet / Koordinator:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {t.delegates.map((d, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "var(--bg-app)",
                        padding: "6px 10px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "12px",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{d.role}</span>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
