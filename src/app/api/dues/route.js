import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "September 2026";
    const satker = searchParams.get("satker") || "Pengadilan Agama Gunung Sugih";

    // Query members untuk satker ini
    const members = await query(
      "SELECT m.*, d.paid, d.paid_date FROM members m LEFT JOIN dues_records d ON m.id = d.member_id AND d.period = ? WHERE m.satker = ? ORDER BY m.id ASC",
      [period, satker]
    );

    const formatted = members.map((m) => ({
      id: m.id,
      name: m.name,
      nip: m.nip || "",
      title: m.title || "",
      category: m.category || "Hakim",
      pusat: Number(m.pusat || 0),
      daerah: Number(m.daerah || 0),
      cabang: Number(m.cabang || 0),
      tournamen: Number(m.tournamen || 0),
      phone: m.phone || "",
      paid: Boolean(m.paid),
      paidDate: m.paid_date || null,
      satker: m.satker,
    }));

    return NextResponse.json({ success: true, period, satker, data: formatted });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, period, satker, memberId, paid, memberData, membersList } = body;

    // Aksi 1: Toggle bayar per anggota
    if (action === "toggle_paid") {
      const isPaid = paid ? 1 : 0;
      const paidDate = paid ? new Date().toISOString().split("T")[0] : null;

      await query(
        `INSERT INTO dues_records (period, satker, member_id, paid, paid_date)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE paid = VALUES(paid), paid_date = VALUES(paid_date)`,
        [period, satker, memberId, isPaid, paidDate]
      );

      return NextResponse.json({ success: true });
    }

    // Aksi 2: Simpan seluruh list anggota (Import / Bulk Update)
    if (action === "save_all" && Array.isArray(membersList)) {
      for (const m of membersList) {
        await query(
          `INSERT INTO members (id, satker, nip, name, title, category, pusat, daerah, cabang, tournamen, phone)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE nip=VALUES(nip), name=VALUES(name), title=VALUES(title), category=VALUES(category), pusat=VALUES(pusat), daerah=VALUES(daerah), cabang=VALUES(cabang), tournamen=VALUES(tournamen), phone=VALUES(phone)`,
          [m.id, satker, m.nip || "", m.name, m.title || "", m.category || "Hakim", m.pusat || 0, m.daerah || 0, m.cabang || 0, m.tournamen || 0, m.phone || ""]
        );

        if (typeof m.paid !== "undefined") {
          await query(
            `INSERT INTO dues_records (period, satker, member_id, paid, paid_date)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE paid = VALUES(paid), paid_date = VALUES(paid_date)`,
            [period, satker, m.id, m.paid ? 1 : 0, m.paid ? (m.paidDate || new Date().toISOString().split("T")[0]) : null]
          );
        }
      }
      return NextResponse.json({ success: true, count: membersList.length });
    }

    // Aksi 3: Tambah / Update 1 anggota
    if (action === "upsert_member" && memberData) {
      const id = memberData.id || `M-${Date.now()}`;
      await query(
        `INSERT INTO members (id, satker, nip, name, title, category, pusat, daerah, cabang, tournamen, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE nip=VALUES(nip), name=VALUES(name), title=VALUES(title), category=VALUES(category), pusat=VALUES(pusat), daerah=VALUES(daerah), cabang=VALUES(cabang), tournamen=VALUES(tournamen), phone=VALUES(phone)`,
        [id, satker, memberData.nip || "", memberData.name, memberData.title || "", memberData.category || "Hakim", memberData.pusat || 0, memberData.daerah || 0, memberData.cabang || 0, memberData.tournamen || 0, memberData.phone || ""]
      );
      return NextResponse.json({ success: true, id });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenali." });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    const period = searchParams.get("period");
    const clearAll = searchParams.get("clearAll");
    const satker = searchParams.get("satker") || "Pengadilan Agama Gunung Sugih";

    if (clearAll === "true") {
      await query("DELETE FROM dues_records WHERE satker = ?", [satker]);
      await query("DELETE FROM members WHERE satker = ?", [satker]);
      return NextResponse.json({ success: true, message: `Seluruh data iuran ${satker} berhasil dikosongkan.` });
    }

    if (period) {
      await query("DELETE FROM dues_records WHERE satker = ? AND period = ?", [satker, period]);
      return NextResponse.json({ success: true, message: `Data iuran periode ${period} berhasil dikosongkan.` });
    }

    if (!memberId) return NextResponse.json({ success: false, error: "memberId wajib diisi." });

    await query("DELETE FROM dues_records WHERE member_id = ? AND satker = ?", [memberId, satker]);
    await query("DELETE FROM members WHERE id = ? AND satker = ?", [memberId, satker]);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
