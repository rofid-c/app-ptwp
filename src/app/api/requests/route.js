import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await query("SELECT * FROM account_requests ORDER BY created_at DESC");
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, satker, phone, title, password, note } = body;

    const id = `REQ-${Date.now()}`;
    await query(
      "INSERT INTO account_requests (id, name, email, satker, phone, title, password, note, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
      [id, name, email, satker, phone, title || "Pegawai", password, note || ""]
    );

    return NextResponse.json({ success: true, id, message: "Pengajuan akun berhasil dikirim ke Administrator." });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, action } = body; // action: 'approve' | 'reject'

    const rows = await query("SELECT * FROM account_requests WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Permohonan tidak ditemukan." });
    }

    const reqData = rows[0];

    if (action === "approve") {
      await query("UPDATE account_requests SET status = 'approved', approved_at = NOW() WHERE id = ?", [id]);

      const genUsername = reqData.email
        ? reqData.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "_")
        : reqData.name.toLowerCase().replace(/[^a-z0-9]/g, "_");

      const userPassword = reqData.password || "123";

      // Insert or update into users
      await query(
        `INSERT INTO users (username, password, name, phone, email, satker, title, role, role_label, level, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'anggota', 'Pegawai / Anggota Satker', 'cabang', 'active')
         ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name), phone = VALUES(phone), email = VALUES(email), satker = VALUES(satker), title = VALUES(title)`,
        [genUsername, userPassword, reqData.name, reqData.phone || "", reqData.email || "", reqData.satker || "Pengadilan Agama Gunung Sugih", reqData.title || "Pegawai"]
      );

      return NextResponse.json({
        success: true,
        user: {
          username: genUsername,
          password: userPassword,
          name: reqData.name,
          satker: reqData.satker,
          phone: reqData.phone,
          email: reqData.email,
        }
      });
    } else if (action === "reject") {
      await query("UPDATE account_requests SET status = 'rejected', rejected_at = NOW() WHERE id = ?", [id]);
      return NextResponse.json({ success: true, message: "Permohonan telah ditolak." });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenali." });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID wajib diisi." });

    await query("DELETE FROM account_requests WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
