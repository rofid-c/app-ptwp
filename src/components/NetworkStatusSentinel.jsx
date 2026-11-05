"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, CheckCircle2, RotateCcw } from "lucide-react";

export default function NetworkStatusSentinel() {
  const [isOffline, setIsOffline] = useState(false);
  const [reconnected, setReconnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOffline(false);
      setReconnected(true);
      setTimeout(() => setReconnected(false), 3500);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline && !reconnected) return null;

  return (
    <aside
      className={`ptwp-network-sentinel ${isOffline ? "status-offline" : "status-reconnected"}`}
      aria-live="polite"
    >
      {isOffline ? (
        <div className="sentinel-content">
          <div className="sentinel-icon-circle offline-circle">
            <WifiOff size={15} />
          </div>
          <div className="sentinel-text">
            <strong>Koneksi Terputus</strong>
            <span>Menunggu jaringan terhubung kembali...</span>
          </div>
          <button
            type="button"
            className="sentinel-retry-btn"
            onClick={() => {
              if (typeof window !== "undefined") {
                if (navigator.onLine) {
                  setIsOffline(false);
                  setReconnected(true);
                  setTimeout(() => setReconnected(false), 3000);
                } else {
                  window.location.reload();
                }
              }
            }}
          >
            <RotateCcw size={13} />
            <span>Coba Ulang</span>
          </button>
        </div>
      ) : (
        <div className="sentinel-content">
          <div className="sentinel-icon-circle online-circle">
            <CheckCircle2 size={15} />
          </div>
          <div className="sentinel-text">
            <strong>Terhubung Kembali</strong>
            <span>Sinkronisasi sistem PTWP aktif</span>
          </div>
        </div>
      )}
    </aside>
  );
}

