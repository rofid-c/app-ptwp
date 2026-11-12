import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const satker = searchParams.get("satker") || "Pengadilan Agama Gunung Sugih";

    const rows = await query("SELECT * FROM cashbook WHERE satker = ? ORDER BY date DESC, id DESC", [satker]);
    const formatted = rows.map((r) => ({
      ...r,
      amount: Number(r.amount || 0),
    }));
    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Dukungan Batch Insert untuk banyak transaksi kas & belanja sekaligus
    if (Array.isArray(body)) {
      if (body.length === 0) return NextResponse.json({ success: true, count: 0 });

      const values = body.map((item, idx) => [
        item.id || `CB-${Date.now()}-${idx}`,
        item.satker || "Pengadilan Agama Gunung Sugih",
        item.date || new Date().toISOString().split("T")[0],
        item.type || "out",
        item.category || "Operasional Lapangan",
        Number(item.amount || 0),
        item.description || "",
        item.source || "manual",
        item.period || null,
      ]);

      // Batch insert dengan chunking aman (50 rows per query) untuk menghindari limit placeholder MySQL
      const chunkSize = 50;
      for (let i = 0; i < values.length; i += chunkSize) {
        const chunk = values.slice(i, i + chunkSize);
        const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
        const flatValues = chunk.flat();

        await query(
          `INSERT INTO cashbook (id, satker, date, type, category, amount, description, source, period)
           VALUES ${placeholders}
           ON DUPLICATE KEY UPDATE date=VALUES(date), type=VALUES(type), category=VALUES(category), amount=VALUES(amount), description=VALUES(description), source=VALUES(source), period=VALUES(period)`,
          flatValues
        );
      }

      // Rekam jejak audit batch kas
      try {
        const first = body[0];
        const targetSatker = first?.satker || "Pengadilan Agama Gunung Sugih";
        const actorName = first?.userName || first?.user_name || "Bendahara Cabang";
        await query(
          `INSERT INTO audit_logs (satker, user_name, user_role, action, module, entity_id, period, old_value, new_value, description)
           VALUES (?, ?, 'Bendahara', 'ADD_CASH_BATCH', 'Buku Kas', ?, ?, NULL, ?, ?)`,
          [
            targetSatker,
            actorName,
            `batch_${Date.now()}`,
            first?.period || null,
            JSON.stringify({ count: body.length }),
            `Pencatatan batch transaksi kas/belanja sebanyak ${body.length} baris untuk ${targetSatker}.`,
          ]
        );
      } catch (e) {}

      return NextResponse.json({ success: true, count: body.length });
    }

    const { id, satker, date, type, category, amount, description, source, period, userName, userRole } = body;

    const entryId = id || `CB-${Date.now()}`;
    await query(
      `INSERT INTO cashbook (id, satker, date, type, category, amount, description, source, period)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE date=VALUES(date), type=VALUES(type), category=VALUES(category), amount=VALUES(amount), description=VALUES(description), source=VALUES(source), period=VALUES(period)`,
      [entryId, satker, date, type, category, amount, description, source || "manual", period || null]
    );

    // Rekam jejak audit transaksi kas
    try {
      const actorName = userName || body.user_name || "Bendahara Cabang";
      const actorRole = userRole || body.user_role || "Bendahara";
      const tipeLabel = type === "in" ? "Kas Masuk" : "Kas Keluar / Belanja";
      await query(
        `INSERT INTO audit_logs (satker, user_name, user_role, action, module, entity_id, period, old_value, new_value, description)
         VALUES (?, ?, ?, 'ADD_CASH', 'Buku Kas', ?, ?, NULL, ?, ?)`,
        [
          satker,
          actorName,
          actorRole,
          entryId,
          period || null,
          JSON.stringify({ type, category, amount: Number(amount || 0), description }),
          `Pencatatan ${tipeLabel}: Rp ${Number(amount || 0).toLocaleString("id-ID")} (${category} - "${description}").`,
        ]
      );
    } catch (e) {}

    return NextResponse.json({ success: true, id: entryId });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const period = searchParams.get("period");
    const clearAll = searchParams.get("clearAll");
    const satker = searchParams.get("satker") || "Pengadilan Agama Gunung Sugih";

    if (clearAll === "true") {
      await query("DELETE FROM cashbook WHERE satker = ?", [satker]);
      return NextResponse.json({ success: true, message: `Seluruh data buku kas ${satker} berhasil dikosongkan.` });
    }

    if (period) {
      await query("DELETE FROM cashbook WHERE satker = ? AND (period = ? OR description LIKE ? OR id LIKE ?)", [
        satker,
        period,
        `%${period}%`,
        `%${period}%`,
      ]);
      return NextResponse.json({ success: true, message: `Data kas periode ${period} (${satker}) berhasil dikosongkan.` });
    }

    if (!id) return NextResponse.json({ success: false, error: "ID mutasi kas wajib diisi." });

    // Ambil info data kas sebelum dihapus untuk audit trail
    const existingRows = await query("SELECT * FROM cashbook WHERE id = ? AND satker = ?", [id, satker]);
    const existingEntry = existingRows && existingRows.length > 0 ? existingRows[0] : null;

    await query("DELETE FROM cashbook WHERE id = ? AND satker = ?", [id, satker]);

    try {
      const actorName = searchParams.get("userName") || "Bendahara Cabang";
      await query(
        `INSERT INTO audit_logs (satker, user_name, user_role, action, module, entity_id, period, old_value, new_value, description)
         VALUES (?, ?, 'Bendahara', 'DELETE_CASH', 'Buku Kas', ?, ?, ?, NULL, ?)`,
        [
          satker,
          actorName,
          id,
          existingEntry?.period || null,
          existingEntry ? JSON.stringify({ type: existingEntry.type, amount: Number(existingEntry.amount), description: existingEntry.description }) : null,
          `Penghapusan mutasi kas ID "${id}": ${existingEntry?.description || "-"} (Rp ${Number(existingEntry?.amount || 0).toLocaleString("id-ID")}).`,
        ]
      );
    } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
