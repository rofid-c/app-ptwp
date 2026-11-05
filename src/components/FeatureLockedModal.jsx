"use client";

import React, { useState } from "react";
import {
  Lock,
  ShieldAlert,
  MessageCircle,
  Copy,
  Check,
  X,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function FeatureLockedModal({
  isOpen,
  onClose,
  featureName = "Fitur Eksklusif",
  featureDescription = "Fitur ini memerlukan lisensi aktif.",
  currentSatker = "Satuan Kerja Anda",
}) {
  const [copied, setCopied] = useState(false);
  const waNumber = "085727738428";
  const waFormatted = "0857-2773-8428";

  const isPTA =
    (currentSatker || "").toLowerCase().includes("tinggi") ||
    (currentSatker || "").toLowerCase().includes("pta");

  if (!isOpen) return null;

  const waMessage = encodeURIComponent(
    `Halo Developer PTWP, saya dari ${currentSatker}. Saya ingin membuka akses fitur eksklusif: "${featureName}". Mohon informasi langkah aktivasinya. Terima kasih.`
  );
  const waUrl = `https://wa.me/6285727738428?text=${waMessage}`;

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(waNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="feature-locked-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="feature-locked-modal animate-scale-in">
        {/* Close Button */}
        <button
          type="button"
          className="locked-close-btn"
          onClick={onClose}
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        {/* Halo Lock Icon */}
        <div className="locked-icon-halo">
          <div className="locked-icon-inner">
            <Lock size={32} color="#ffffff" strokeWidth={2.4} />
          </div>
        </div>

        {/* Badge & Title */}
        <div className="locked-badge">
          <Sparkles size={12} />
          <span>FITUR EKSKLUSIF TERKUNCI</span>
        </div>

        <h3 className="locked-title">{featureName}</h3>

        <div className="locked-body">
          <p className="locked-main-text">
            Fitur ini terkunci untuk akun <strong>{currentSatker}</strong>. Sesuai kewenangan, akun Pengadilan Tinggi Agama difokuskan untuk <strong>Monitoring Cabang</strong> dan tidak mengelola transaksi atau iuran internal cabang.
          </p>

          <p className="locked-sub-text">
            Silakan hubungi developer resmi PTWP jika memerlukan pembukaan atau kustomisasi modul khusus untuk PTA.
          </p>

          {/* Contact Box */}
          <div className="locked-contact-card">
            <div className="contact-label-row">
              <span className="contact-badge-title">KONTAK RESMI DEVELOPER</span>
              <span className="contact-online-status">
                <span className="online-ping" />
                Siap Melayani
              </span>
            </div>

            <div className="contact-main-row">
              <div className="wa-icon-box">
                <MessageCircle size={22} color="#ffffff" />
              </div>
              <div className="contact-details">
                <span className="contact-name">WhatsApp Pengembang PTWP</span>
                <span className="contact-number font-mono-num">{waFormatted}</span>
              </div>

              <button
                type="button"
                className={`copy-wa-btn ${copied ? "copied" : ""}`}
                onClick={handleCopy}
                title="Salin nomor WhatsApp"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? "Tersalin!" : "Salin"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="locked-actions">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="locked-wa-link"
          >
            <MessageCircle size={17} />
            <span>Hubungi via WhatsApp</span>
            <ExternalLink size={14} className="ml-auto" />
          </a>

          <button
            type="button"
            className="locked-dismiss-btn"
            onClick={onClose}
          >
            Kembali
          </button>
        </div>
      </div>
    </div>
  );
}

