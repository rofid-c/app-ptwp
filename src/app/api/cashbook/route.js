import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const satker = searchParams.get("satker") || "Pengadilan Agama Gunung Sugih";

    const rows = await query("SELECT * FROM cashbook WHERE satker = ? ORDER BY date DESC, id DESC", [satker]);
    return NextResponse.json({ success: true, data: rows });
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

      await query(
        `INSERT INTO cashbook (id, satker, date, type, category, amount, description, source, period)
         VALUES ?
         ON DUPLICATE KEY UPDATE date=VALUES(date), type=VALUES(type), category=VALUES(category), amount=VALUES(amount), description=VALUES(description), source=VALUES(source), period=VALUES(period)`,
        [values]
      );

      return NextResponse.json({ success: true, count: body.length });
    }

    const { id, satker, date, type, category, amount, description, source, period } = body;

    const entryId = id || `CB-${Date.now()}`;
    await query(
      `INSERT INTO cashbook (id, satker, date, type, category, amount, description, source, period)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE date=VALUES(date), type=VALUES(type), category=VALUES(category), amount=VALUES(amount), description=VALUES(description), source=VALUES(source), period=VALUES(period)`,
      [entryId, satker, date, type, category, amount, description, source || "manual", period || null]
    );

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

    if (clearAll === "true") {
      await query("DELETE FROM cashbook");
      return NextResponse.json({ success: true, message: "Seluruh data buku kas berhasil dikosongkan." });
    }

    if (period) {
      await query("DELETE FROM cashbook WHERE period = ? OR description LIKE ? OR id LIKE ?", [
        period,
        `%${period}%`,
        `%${period}%`,
      ]);
      return NextResponse.json({ success: true, message: `Data kas periode ${period} berhasil dikosongkan.` });
    }

    if (!id) return NextResponse.json({ success: false, error: "ID mutasi kas wajib diisi." });

    await query("DELETE FROM cashbook WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
