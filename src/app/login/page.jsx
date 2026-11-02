"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AuthView from "@/components/AuthView";
import { registerUser, loginUser } from "@/services/storageService";

export default function LoginPage() {
  const router = useRouter();

  const handleCircularTransition = (callback) => {
    if (
      typeof document === "undefined" ||
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      callback();
      return;
    }

    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const endRadius = Math.hypot(x, y);

    const transition = document.startViewTransition(() => {
      callback();
    });

    transition.ready.then(() => {
      // 1. Dashboard baru membesar melingkar dari tengah menuhin layar (On Top, z-index 9999)
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 1500,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );

      // 2. Form login lama memudar, blur & menyusut lembut agar tidak menindih/menutupi lingkaran
      document.documentElement.animate(
        {
          opacity: [1, 0.5, 0],
          transform: ["scale(1)", "scale(0.95)"],
          filter: ["blur(0px)", "blur(12px)"],
        },
        {
          duration: 1500,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-old(root)",
        }
      );
    });
  };

  const handleLoginSuccess = (user) => {
    loginUser(user, "", user.satker);
    handleCircularTransition(() => {
      router.push("/");
    });
  };

  const handleBypass = () => {
    handleCircularTransition(() => {
      router.push("/");
    });
  };

  return (
    <AuthView
      onLoginSuccess={handleLoginSuccess}
      onBypassToDashboard={handleBypass}
      defaultMode="login"
    />
  );
}
