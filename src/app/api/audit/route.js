import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const satker = searchParams.get("satker");
    const moduleFilter = searchParams.get("module");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "150", 10);

    let sql = "SELECT * FROM audit_logs WHERE 1=1";
    const params = [];

    // Filter satker (jika bukan "ALL" atau "Semua")
    if (satker && satker !== "ALL" && satker !== "all" && satker !== "Semua Satker") {
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
    const statsParams = satker && satker !== "ALL" && satker !== "all" && satker !== "Semua Satker" ? [satker] : [];
    const satkerWhere = satker && satker !== "ALL" && satker !== "all" && satker !== "Semua Satker" ? "WHERE satker = ?" : "";

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
        ipAddress: r.ip_address,
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

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      satker = "Pengadilan Agama Gunung Sugih",
      userId = null,
      userName = "Pengguna Sistem",
      userRole = "Bendahara",
      action = "UPDATE",
      module = "Umum",
      entityId = null,
      period = null,
      oldValue = null,
      newValue = null,
      description = "",
      ipAddress = "127.0.0.1",
    } = body;

    const oldStr = oldValue ? JSON.stringify(oldValue) : null;
    const newStr = newValue ? JSON.stringify(newValue) : null;

    const res = await query(
      `INSERT INTO audit_logs (satker, user_id, user_name, user_role, action, module, entity_id, period, old_value, new_value, description, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [satker, userId, userName, userRole, action, module, entityId, period, oldStr, newStr, description, ipAddress]
    );

    return NextResponse.json({ success: true, id: res.insertId });
  } catch (err) {
    console.error("[API Audit POST Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
