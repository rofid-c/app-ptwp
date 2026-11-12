import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashPassword, getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const user = getAuthenticatedUser(request);
    const isSuperAdmin = user?.role === "super_admin" || user?.level === "super_admin" || String(user?.username || "").toLowerCase() === "aku admin";

    if (!isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Hanya Super Administrator yang berhak mengakses data pengguna." },
        { status: 403 }
      );
    }

    const rows = await query("SELECT id, username, name, phone, email, satker, title, role, role_label, level, status, created_at FROM users ORDER BY id ASC");
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getAuthenticatedUser(request);
    const isSuperAdmin = user?.role === "super_admin" || user?.level === "super_admin" || String(user?.username || "").toLowerCase() === "aku admin";

    if (!isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Hanya Super Administrator yang berhak menambah/mengubah pengguna." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password, name, phone, email, satker, title, role, role_label } = body;

    const hashedPassword = hashPassword(password || "123");

    await query(
      `INSERT INTO users (username, password, name, phone, email, satker, title, role, role_label, level, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'cabang', 'active')
       ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name), phone = VALUES(phone), email = VALUES(email), satker = VALUES(satker), title = VALUES(title), role = VALUES(role), role_label = VALUES(role_label)`,
      [username, hashedPassword, name, phone || "", email || "", satker, title || "Pegawai", role || "anggota", role_label || "Pegawai / Anggota Satker"]
    );

    return NextResponse.json({ success: true, message: "Pengguna berhasil disimpan dengan kata sandi terenkripsi." });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = getAuthenticatedUser(request);
    const isSuperAdmin = user?.role === "super_admin" || user?.level === "super_admin" || String(user?.username || "").toLowerCase() === "aku admin";

    if (!isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Hanya Super Administrator yang berhak menghapus pengguna." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    if (!username) return NextResponse.json({ success: false, error: "Username wajib diisi." });

    if (username.toLowerCase() === "aku admin") {
      return NextResponse.json({ success: false, error: "Akun Super Administrator tidak dapat dihapus." }, { status: 400 });
    }

    await query("DELETE FROM users WHERE LOWER(username) = ?", [username.toLowerCase()]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
