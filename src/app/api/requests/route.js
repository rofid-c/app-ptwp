import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashPassword, getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Helper untuk memeriksa hak administratif pengguna
 */
function checkAdminAccess(user) {
  if (!user) return { authorized: false, isPTA: false, isSuperAdmin: false };

  const userSatkerNorm = String(user.satker || "").trim().toLowerCase();
  const isSuperAdmin = user.role === "super_admin" || user.level === "super_admin";
  const isPTA =
    user.level === "daerah" ||
    userSatkerNorm.includes("tinggi") ||
    userSatkerNorm.includes("pta");
  const isStaffAdmin =
    user.role === "bendahara" ||
    user.role === "admin" ||
    user.role === "pimpinan";

  const authorized = isSuperAdmin || isPTA || isStaffAdmin;
  return { authorized, isPTA, isSuperAdmin };
}

// GET: Ambil daftar permohonan akun (HANYA untuk Administrator Terautentikasi)
// PENTING: Kolom password TIDAK PERNAH ditarik dari database demi privasi & keamanan!
export async function GET(request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Autentikasi Diperlukan: Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    const { authorized, isPTA, isSuperAdmin } = checkAdminAccess(user);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki wewenang untuk melihat data permohonan akun." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedSatker = searchParams.get("satker");

    // Isolasi Multi-Tenant Satker:
    // - Super Admin & Pengurus PTA: Boleh melihat seluruh satker atau memfilter cabang tertentu
    // - Admin Cabang (misal PA Gunung Sugih): HANYA boleh melihat permohonan satkernya sendiri
    let sql = `SELECT id, name, email, satker, phone, title, note, status, created_at, approved_at, rejected_at
               FROM account_requests`;
    const params = [];

    if (!isSuperAdmin && !isPTA) {
      sql += " WHERE satker = ?";
      params.push(user.satker);
    } else if (requestedSatker && requestedSatker !== "all") {
      sql += " WHERE satker = ?";
      params.push(requestedSatker);
    }

    sql += " ORDER BY created_at DESC";

    const rows = await query(sql, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error("[API Requests GET Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Pengajuan akun baru dari calon pengguna (Formulir Publik Halaman Login)
// PENTING: Password langsung di-hash menggunakan algoritma scrypt dengan salt acak sebelum disimpan!
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, satker, phone, title, password, note } = body;

    // 1. Validasi Input
    if (!name || String(name).trim().length < 2) {
      return NextResponse.json({ success: false, error: "Nama lengkap wajib diisi minimal 2 karakter." }, { status: 400 });
    }
    if (!email || !String(email).includes("@")) {
      return NextResponse.json({ success: false, error: "Alamat email tidak valid." }, { status: 400 });
    }
    if (!satker || !String(satker).trim()) {
      return NextResponse.json({ success: false, error: "Satuan kerja wajib dipilih." }, { status: 400 });
    }
    if (!phone || String(phone).trim().length < 6) {
      return NextResponse.json({ success: false, error: "Nomor WhatsApp wajib diisi minimal 6 digit." }, { status: 400 });
    }
    if (!password || String(password).trim().length < 4) {
      return NextResponse.json({ success: false, error: "Kata sandi minimal harus 4 karakter." }, { status: 400 });
    }

    // 2. Hash Password Seketika (Zero Plaintext Storage)
    const cleanPassword = String(password).trim();
    const hashedPassword = hashPassword(cleanPassword);

    const id = `REQ-${Date.now()}`;
    await query(
      `INSERT INTO account_requests (id, name, email, satker, phone, title, password, note, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        id,
        String(name).trim(),
        String(email).trim().toLowerCase(),
        String(satker).trim(),
        String(phone).trim(),
        String(title || "Pegawai").trim(),
        hashedPassword,
        String(note || "").trim(),
      ]
    );

    return NextResponse.json({
      success: true,
      id,
      message: "Pengajuan akun berhasil dikirim ke Administrator untuk diverifikasi.",
    });
  } catch (err) {
    console.error("[API Requests POST Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Setujui (Approve) atau Tolak (Reject) permohonan akun
// PENTING:
// - Hanya dapat dilakukan oleh Administrator Terautentikasi
// - Password TIDAK PERNAH dikembalikan dalam response JSON
export async function PUT(request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Autentikasi Diperlukan: Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    const { authorized, isPTA, isSuperAdmin } = checkAdminAccess(user);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Hanya administrator atau bendahara yang dapat memproses permohonan akun." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, action } = body; // action: 'approve' | 'reject'

    if (!id || !action) {
      return NextResponse.json({ success: false, error: "ID permohonan dan aksi wajib diisi." }, { status: 400 });
    }

    const rows = await query("SELECT * FROM account_requests WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Permohonan tidak ditemukan." }, { status: 404 });
    }

    const reqData = rows[0];

    // Isolasi Satker: Admin cabang hanya boleh approve/reject untuk cabangnya sendiri
    if (!isSuperAdmin && !isPTA) {
      const userSatkerNorm = String(user.satker || "").trim().toLowerCase();
      const reqSatkerNorm = String(reqData.satker || "").trim().toLowerCase();
      if (userSatkerNorm !== reqSatkerNorm) {
        return NextResponse.json(
          { success: false, error: `Akses Ditolak: Anda hanya berwenang memproses permohonan pada ${user.satker}.` },
          { status: 403 }
        );
      }
    }

    if (action === "approve") {
      await query("UPDATE account_requests SET status = 'approved', approved_at = NOW() WHERE id = ?", [id]);

      const genUsername = reqData.email
        ? reqData.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_")
        : reqData.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");

      // Pastikan password yang disimpan ke tabel users ter-hash dengan aman
      let passwordHashToStore = reqData.password;
      if (!passwordHashToStore || !passwordHashToStore.startsWith("$scrypt$")) {
        passwordHashToStore = hashPassword(passwordHashToStore || "123456");
      }

      // Masukkan atau perbarui user di tabel users dengan password ter-hash
      await query(
        `INSERT INTO users (username, password, name, phone, email, satker, title, role, role_label, level, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'anggota', 'Pegawai / Anggota Satker', 'cabang', 'active')
         ON DUPLICATE KEY UPDATE 
           password = VALUES(password), 
           name = VALUES(name), 
           phone = VALUES(phone), 
           email = VALUES(email), 
           satker = VALUES(satker), 
           title = VALUES(title),
           status = 'active'`,
        [
          genUsername,
          passwordHashToStore,
          reqData.name,
          reqData.phone || "",
          reqData.email || "",
          reqData.satker || "Pengadilan Agama Gunung Sugih",
          reqData.title || "Pegawai",
        ]
      );

      // Rekam jejak audit (Audit Trail)
      try {
        await query(
          `INSERT INTO audit_logs (satker, user_name, user_role, action, module, entity_id, period, old_value, new_value, description)
           VALUES (?, ?, ?, 'APPROVE_ACCOUNT', 'Pengguna', ?, NULL, NULL, ?, ?)`,
          [
            reqData.satker,
            user.name || "Administrator",
            user.roleLabel || user.role || "Administrator",
            genUsername,
            JSON.stringify({ name: reqData.name, username: genUsername, email: reqData.email }),
            `Pemberian izin dan penerbitan akun untuk ${reqData.name} (${genUsername}) pada ${reqData.satker}.`,
          ]
        );
      } catch (auditErr) {
        console.error("[Audit Trail Log Error]:", auditErr.message);
      }

      // PENTING: Password TIDAK PERNAH dikembalikan dalam response JSON!
      return NextResponse.json({
        success: true,
        message: `Permohonan akun untuk ${reqData.name} berhasil disetujui.`,
        user: {
          username: genUsername,
          name: reqData.name,
          satker: reqData.satker,
          phone: reqData.phone,
          email: reqData.email,
          role: "anggota",
        },
      });
    } else if (action === "reject") {
      await query("UPDATE account_requests SET status = 'rejected', rejected_at = NOW() WHERE id = ?", [id]);

      // Rekam jejak audit (Audit Trail)
      try {
        await query(
          `INSERT INTO audit_logs (satker, user_name, user_role, action, module, entity_id, period, old_value, new_value, description)
           VALUES (?, ?, ?, 'REJECT_ACCOUNT', 'Pengguna', ?, NULL, NULL, NULL, ?)`,
          [
            reqData.satker,
            user.name || "Administrator",
            user.roleLabel || user.role || "Administrator",
            id,
            `Penolakan permohonan akun untuk ${reqData.name} pada ${reqData.satker}.`,
          ]
        );
      } catch (auditErr) {
        console.error("[Audit Trail Log Error]:", auditErr.message);
      }

      return NextResponse.json({ success: true, message: `Permohonan akun ${reqData.name} telah ditolak.` });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (err) {
    console.error("[API Requests PUT Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Hapus permohonan akun (HANYA untuk Administrator Terautentikasi)
export async function DELETE(request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Autentikasi Diperlukan: Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    const { authorized, isPTA, isSuperAdmin } = checkAdminAccess(user);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Hanya administrator yang dapat menghapus permohonan akun." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID wajib diisi." }, { status: 400 });

    const rows = await query("SELECT satker FROM account_requests WHERE id = ?", [id]);
    if (rows.length > 0 && !isSuperAdmin && !isPTA) {
      const userSatkerNorm = String(user.satker || "").trim().toLowerCase();
      const reqSatkerNorm = String(rows[0].satker || "").trim().toLowerCase();
      if (userSatkerNorm !== reqSatkerNorm) {
        return NextResponse.json(
          { success: false, error: `Akses Ditolak: Anda hanya berwenang mengelola permohonan pada ${user.satker}.` },
          { status: 403 }
        );
      }
    }

    await query("DELETE FROM account_requests WHERE id = ?", [id]);
    return NextResponse.json({ success: true, message: "Permohonan akun berhasil dihapus." });
  } catch (err) {
    console.error("[API Requests DELETE Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
