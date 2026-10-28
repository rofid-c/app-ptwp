"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AuthView from "@/components/AuthView";
import { registerUser, loginUser } from "@/services/storageService";

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = (user) => {
    loginUser(user, "", user.satker);
    router.push("/");
  };

  const handleBypass = () => {
    router.push("/");
  };

  return (
    <AuthView
      onLoginSuccess={handleLoginSuccess}
      onBypassToDashboard={handleBypass}
      defaultMode="login"
    />
  );
}
