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
      `SELECT m.*, d.paid, d.paid_date 
       FROM members m 
       LEFT JOIN dues_records d ON m.id = d.member_id AND d.period = ? AND d.satker = m.satker 
       WHERE m.satker = ? 
       ORDER BY CAST(m.id AS UNSIGNED) ASC, m.id ASC`,
      [period, satker]
    );

    const formatted = members.map((m, idx) => ({
      id: m.id,
      no: idx + 1,
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
    const { action, period, satker, memberId, paid, memberData, membersList, periodsData } = body;

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

    // Aksi 2: Simpan seluruh list anggota (Single Sheet Import / Bulk Update)
    if (action === "save_all" && Array.isArray(membersList)) {
      if (membersList.length === 0) return NextResponse.json({ success: true, count: 0 });

      const chunkSize = 50;

      // 1. Batch upsert data anggota ke tabel members
      for (let i = 0; i < membersList.length; i += chunkSize) {
        const chunk = membersList.slice(i, i + chunkSize);
        const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
        const flatValues = chunk.flatMap((m) => [
          String(m.id || m.no || m.name),
          satker,
          m.nip || "",
          m.name,
          m.title || "",
          m.category || "Hakim",
          Number(m.pusat || 0),
          Number(m.daerah || 0),
          Number(m.cabang || 0),
          Number(m.tournamen || 0),
          m.phone || "",
        ]);

        await query(
          `INSERT INTO members (id, satker, nip, name, title, category, pusat, daerah, cabang, tournamen, phone)
           VALUES ${placeholders}
           ON DUPLICATE KEY UPDATE nip=VALUES(nip), name=VALUES(name), title=VALUES(title), category=VALUES(category), pusat=VALUES(pusat), daerah=VALUES(daerah), cabang=VALUES(cabang), tournamen=VALUES(tournamen), phone=VALUES(phone)`,
          flatValues
        );
      }

      // 2. Batch upsert status iuran ke dues_records
      const recordsToUpsert = membersList
        .filter((m) => typeof m.paid !== "undefined")
        .map((m) => [
          period,
          satker,
          String(m.id || m.no || m.name),
          m.paid ? 1 : 0,
          m.paid ? (m.paidDate || new Date().toISOString().split("T")[0]) : null,
        ]);

      for (let i = 0; i < recordsToUpsert.length; i += chunkSize) {
        const chunk = recordsToUpsert.slice(i, i + chunkSize);
        const placeholders = chunk.map(() => "(?, ?, ?, ?, ?)").join(", ");
        const flatValues = chunk.flat();

        await query(
          `INSERT INTO dues_records (period, satker, member_id, paid, paid_date)
           VALUES ${placeholders}
           ON DUPLICATE KEY UPDATE paid = VALUES(paid), paid_date = VALUES(paid_date)`,
          flatValues
        );
      }

      return NextResponse.json({ success: true, count: membersList.length });
    }

    // Aksi 3: Simpan Banyak Periode Sekaligus (Import Multi-Sheet 9-12 Bulan)
    if (action === "save_multiple_periods" && Array.isArray(periodsData)) {
      if (periodsData.length === 0) return NextResponse.json({ success: true, count: 0 });

      const chunkSize = 50;
      const membersMap = new Map();
      const duesRecords = [];

      periodsData.forEach((item) => {
        const p = item.period;
        const list = Array.isArray(item.members) ? item.members : [];
        list.forEach((m) => {
          if (!m || !m.name) return;
          const memberId = String(m.id || m.no || m.name);

          // Simpan master member unik
          membersMap.set(memberId, {
            id: memberId,
            satker,
            nip: m.nip || "",
            name: m.name,
            title: m.title || "",
            category: m.category || "Hakim",
            pusat: Number(m.pusat || 0),
            daerah: Number(m.daerah || 0),
            cabang: Number(m.cabang || 0),
            tournamen: Number(m.tournamen || 0),
            phone: m.phone || "",
          });

          // Simpan status iuran per periode
          if (typeof m.paid !== "undefined") {
            duesRecords.push([
              p,
              satker,
              memberId,
              m.paid ? 1 : 0,
              m.paid ? (m.paidDate || new Date().toISOString().split("T")[0]) : null,
            ]);
          }
        });
      });

      // 1. Batch upsert members
      const uniqueMembers = Array.from(membersMap.values());
      for (let i = 0; i < uniqueMembers.length; i += chunkSize) {
        const chunk = uniqueMembers.slice(i, i + chunkSize);
        const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
        const flatValues = chunk.flatMap((m) => [
          m.id,
          m.satker,
          m.nip,
          m.name,
          m.title,
          m.category,
          m.pusat,
          m.daerah,
          m.cabang,
          m.tournamen,
          m.phone,
        ]);

        await query(
          `INSERT INTO members (id, satker, nip, name, title, category, pusat, daerah, cabang, tournamen, phone)
           VALUES ${placeholders}
           ON DUPLICATE KEY UPDATE nip=VALUES(nip), name=VALUES(name), title=VALUES(title), category=VALUES(category), pusat=VALUES(pusat), daerah=VALUES(daerah), cabang=VALUES(cabang), tournamen=VALUES(tournamen), phone=VALUES(phone)`,
          flatValues
        );
      }

      // 2. Batch upsert dues_records
      for (let i = 0; i < duesRecords.length; i += chunkSize) {
        const chunk = duesRecords.slice(i, i + chunkSize);
        const placeholders = chunk.map(() => "(?, ?, ?, ?, ?)").join(", ");
        const flatValues = chunk.flat();

        await query(
          `INSERT INTO dues_records (period, satker, member_id, paid, paid_date)
           VALUES ${placeholders}
           ON DUPLICATE KEY UPDATE paid = VALUES(paid), paid_date = VALUES(paid_date)`,
          flatValues
        );
      }

      return NextResponse.json({
        success: true,
        periodsCount: periodsData.length,
        membersCount: uniqueMembers.length,
        duesCount: duesRecords.length,
      });
    }

    // Aksi 4: Tambah / Update 1 anggota
    if (action === "upsert_member" && memberData) {
      const id = String(memberData.id || `M-${Date.now()}`);
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
