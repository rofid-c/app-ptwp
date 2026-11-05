"use client";

import React, { useEffect } from "react";
import { ServerCrash, RotateCcw, Home, ShieldAlert } from "lucide-react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("PTWP Global Fatal Error:", error);
  }, [error]);

  return (
    <html lang="id">
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#0f172a", color: "#f8fafc" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ maxWidth: "520px", width: "100%", background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", padding: "36px 28px", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", color: "#f87171" }}>
              <ShieldAlert size={34} />
            </div>

            <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 10px", color: "#f8fafc" }}>
              Kesalahan Kritis Sistem PTWP
            </h1>
            <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.6, margin: "0 0 24px" }}>
              Aplikasi mengalami kendala mendasar pada lapisan root. Data perbendaharaan dan iuran Anda tetap tersimpan dengan aman di database.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => reset()}
                style={{ background: "#10b981", color: "#ffffff", border: "none", borderRadius: "9999px", padding: "10px 22px", fontSize: "13.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <RotateCcw size={16} />
                <span>Pulihkan Sistem</span>
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = "/"; }}
                style={{ background: "rgba(255,255,255,0.08)", color: "#f8fafc", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "9999px", padding: "10px 20px", fontSize: "13.5px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <Home size={16} />
                <span>Halaman Awal</span>
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

