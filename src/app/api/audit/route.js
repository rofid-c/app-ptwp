import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET: Ambil daftar jejak audit terpadu dengan autentikasi ketat & isolasi multi-tenant satker
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedSatker = searchParams.get("satker");
    const moduleFilter = searchParams.get("module");
    const search = searchParams.get("search");
    const rawLimit = parseInt(searchParams.get("limit") || "150", 10);
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 150 : rawLimit), 500);

    // 1. Otorisasi Pengguna Terautentikasi
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Autentikasi Diperlukan: Silakan masuk terlebih dahulu untuk mengakses jejak audit." },
        { status: 401 }
      );
    }

    // 2. Batasi Akses: Role Anggota biasa DILARANG melihat jejak audit
    if (user.role === "anggota") {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Hanya pengurus (Bendahara, Admin, Pimpinan) yang berwenang melihat jejak audit." },
        { status: 403 }
      );
    }

    const isSuper =
      user.role === "super_admin" ||
      user.level === "super_admin" ||
      String(user.username || "").toLowerCase() === "aku admin" ||
      String(user.username || "").toLowerCase() === "root";

    const isPTA =
      user.level === "daerah" ||
      Boolean(user.satker && (user.satker.toLowerCase().includes("tinggi") || user.satker.toLowerCase().includes("pta")));

    const isSuperOrPTA = isSuper || isPTA;

    // 3. Penegakan Multi-Tenant Satker Isolation:
    // Satker cabang HANYA boleh melihat jejak audit satkernya sendiri!
    let satker = null;
    if (isSuperOrPTA) {
      satker =
        requestedSatker &&
        requestedSatker !== "ALL" &&
        requestedSatker !== "all" &&
        requestedSatker !== "Semua Satker"
          ? requestedSatker
          : null;
    } else {
      satker = user.satker;
    }

    let sql = "SELECT * FROM audit_logs WHERE 1=1";
    const params = [];

    // Filter satker
    if (satker) {
      sql += " AND satker = ?";
      params.push(satker);
    }

    // Filter modul
    if (moduleFilter && moduleFilter !== "ALL" && moduleFilter !== "all" && moduleFilter !== "Semua Modul") {
      sql += " AND module = ?";
      params.push(moduleFilter);
    }

    // Filter kata kunci pencarian
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      sql += " AND (description LIKE ? OR user_name LIKE ? OR satker LIKE ? OR entity_id LIKE ? OR action LIKE ?)";
      params.push(q, q, q, q, q);
    }

    sql += " ORDER BY created_at DESC, id DESC LIMIT ?";
    params.push(limit);

    const rows = await query(sql, params);

    // Ambil statistik ringkas untuk kartu metrik
    const statsParams = satker ? [satker] : [];
    const satkerWhere = satker ? "WHERE satker = ?" : "";

    const [totalStats] = await query(
      `SELECT 
        COUNT(*) AS total_logs,
        SUM(CASE WHEN module = 'Iuran Anggota' THEN 1 ELSE 0 END) AS total_iuran,
        SUM(CASE WHEN module = 'Buku Kas' THEN 1 ELSE 0 END) AS total_kas,
        SUM(CASE WHEN module = 'Dokumen Belanja' THEN 1 ELSE 0 END) AS total_docs,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS today_logs
      FROM audit_logs ${satkerWhere}`,
      statsParams
    );

    const formatted = rows.map((r) => {
      let parsedOld = null;
      let parsedNew = null;
      try {
        parsedOld = typeof r.old_value === "string" ? JSON.parse(r.old_value) : r.old_value;
      } catch (e) {
        parsedOld = r.old_value;
      }
      try {
        parsedNew = typeof r.new_value === "string" ? JSON.parse(r.new_value) : r.new_value;
      } catch (e) {
        parsedNew = r.new_value;
      }

      return {
        id: r.id,
        satker: r.satker,
        userId: r.user_id,
        userName: r.user_name,
        userRole: r.user_role || "Bendahara",
        action: r.action,
        module: r.module,
        entityId: r.entity_id,
        period: r.period,
        oldValue: parsedOld,
        newValue: parsedNew,
        description: r.description,
        ipAddress: r.ip_address || "127.0.0.1",
        createdAt: r.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
      stats: {
        total: Number(totalStats?.total_logs || 0),
        iuran: Number(totalStats?.total_iuran || 0),
        kas: Number(totalStats?.total_kas || 0),
        docs: Number(totalStats?.total_docs || 0),
        today: Number(totalStats?.today_logs || 0),
      },
    });
  } catch (err) {
    console.error("[API Audit GET Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST: DIBLOKIR. Log audit bersifat immutable dan hanya dapat dicatat secara internal oleh transaksi server.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Metode tidak diizinkan (405): Log audit bersifat immutable dan hanya dapat dicatat secara internal oleh transaksi sistem.",
    },
    { status: 405 }
  );
}

/**
 * PUT: DIBLOKIR. Log audit tidak boleh diubah.
 */
export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: "Metode tidak diizinkan (405): Log audit bersifat immutable dan tidak dapat diubah.",
    },
    { status: 405 }
  );
}

/**
 * DELETE: DIBLOKIR. Log audit tidak boleh dihapus.
 */
export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: "Metode tidak diizinkan (405): Log audit bersifat permanen dan tidak dapat dihapus.",
    },
    { status: 405 }
  );
}

/**
 * PATCH: DIBLOKIR.
 */
export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      error: "Metode tidak diizinkan (405): Log audit bersifat immutable.",
    },
    { status: 405 }
  );
}
