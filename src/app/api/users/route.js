import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await query("SELECT id, username, password, name, phone, email, satker, title, role, role_label, level, status, created_at FROM users ORDER BY id ASC");
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, name, phone, email, satker, title, role, role_label } = body;

    await query(
      `INSERT INTO users (username, password, name, phone, email, satker, title, role, role_label, level, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'cabang', 'active')
       ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name), phone = VALUES(phone), email = VALUES(email), satker = VALUES(satker), title = VALUES(title), role = VALUES(role), role_label = VALUES(role_label)`,
      [username, password, name, phone || "", email || "", satker, title || "Pegawai", role || "anggota", role_label || "Pegawai / Anggota Satker"]
    );

    return NextResponse.json({ success: true, message: "Pengguna berhasil disimpan." });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
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
