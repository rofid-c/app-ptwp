"use client";

import React from "react";
import { Lock } from "lucide-react";

export default function LockedBlurOverlay({ onUnlockClick }) {
  return (
    <div
      className="locked-blur-overlay"
      onClick={onUnlockClick}
      title="Fitur terkunci. Klik untuk informasi aktivasi & kontak developer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (onUnlockClick) onUnlockClick();
        }
      }}
    >
      <button
        type="button"
        className="locked-floating-icon-btn"
        onClick={(e) => {
          e.stopPropagation();
          if (onUnlockClick) onUnlockClick();
        }}
        aria-label="Fitur terkunci, klik untuk membuka detail"
      >
        <div className="locked-icon-pulse-ring" />
        <div className="locked-icon-circle">
          <Lock size={30} color="#ffffff" strokeWidth={2.4} />
        </div>
      </button>
    </div>
  );
}
