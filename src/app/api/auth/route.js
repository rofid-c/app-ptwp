import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword, hashPassword, createSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const { satker, identifier, password } = body;

    const cleanId = String(identifier || "").trim().toLowerCase();
    const cleanPassword = String(password || "").trim();
    const cleanSatker = String(satker || "").trim().toLowerCase();

    // 1. Cari user di DB berdasarkan username, no WA, email, atau nama
    const users = await query(
      "SELECT * FROM users WHERE LOWER(username) = ? OR phone = ? OR LOWER(email) = ? OR LOWER(name) = ?",
      [cleanId, cleanId, cleanId, cleanId]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Akun tidak terdaftar. Pastikan Username, NIP, atau Satuan Kerja yang dipilih sudah benar."
      });
    }

    const user = users[0];
    const isSuperAdmin = user.role === "super_admin" || user.level === "super_admin" || user.username.toLowerCase() === "aku admin" || user.username.toLowerCase() === "root";
    const isPusat = user.role === "pusat" || user.level === "pusat";

    // 2. Verifikasi Password Secara Kriptografis (Hapus seluruh backdoor & password cadangan teks biasa)
    const verification = verifyPassword(cleanPassword, user.password);
    if (!verification.valid) {
      return NextResponse.json({
        success: false,
        error: "Kata sandi yang Anda masukkan salah. Silakan periksa kembali."
      });
    }

    // Jika password lama masih teks biasa, upgrade otomatis ke format hash scrypt yang aman
    if (verification.needsUpgrade) {
      try {
        const secureHash = hashPassword(cleanPassword);
        await query("UPDATE users SET password = ? WHERE id = ?", [secureHash, user.id]);
      } catch (upgErr) {
        console.error("[Password Upgrade Error]:", upgErr);
      }
    }

    // 3. Verifikasi Satker
    const userSatkerNorm = String(user.satker || "").trim().toLowerCase();
    if (!isSuperAdmin && !isPusat && cleanSatker && userSatkerNorm !== cleanSatker) {
      return NextResponse.json({
        success: false,
        error: `Akun ini terdaftar pada ${user.satker}. Silakan pilih Satuan Kerja yang sesuai.`,
        registeredSatker: user.satker
      });
    }

    const activeSatker = isSuperAdmin
      ? "Seluruh Satuan Kerja (Super Admin)"
      : isPusat
      ? (satker || "Mahkamah Agung RI")
      : (user.satker || satker || "Pengadilan Agama Gunung Sugih");

    const userPayload = {
      id: user.id,
      username: user.username,
      name: user.name,
      phone: user.phone,
      email: user.email,
      satker: activeSatker,
      title: user.title,
      role: user.role,
      roleLabel: user.role_label,
      level: user.level,
      status: user.status,
    };

    // 4. Terbitkan Token Sesi Aman Ber-tanda tangan HMAC SHA-256
    const token = createSessionToken(userPayload);
    userPayload.token = token;

    const response = NextResponse.json({
      success: true,
      user: userPayload,
      token,
    });

    // Simpan token juga di HTTP-Only Cookie untuk keamanan tingkat tinggi
    response.cookies.set("ptwp_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 hari
    });

    return response;
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
