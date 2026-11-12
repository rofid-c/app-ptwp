import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "September 2026";
    const satker = searchParams.get("satker") || "Pengadilan Agama Gunung Sugih";
    const getPeriods = searchParams.get("getPeriods");

    // Jika minta daftar periode yang memiliki data di MySQL
    if (getPeriods === "true") {
      const rows = await query(
        `SELECT DISTINCT period FROM members WHERE satker = ?
         UNION
         SELECT DISTINCT period FROM cashbook WHERE satker = ? AND period IS NOT NULL`,
        [satker, satker]
      );
      return NextResponse.json({ success: true, periods: rows.map((r) => r.period).filter(Boolean) });
    }

    // 1. Query members spesifik untuk Satker dan Periode bulan ini
    let members = await query(
      `SELECT m.*, COALESCE(d.paid, m.paid, 1) AS final_paid, COALESCE(d.paid_date, m.paid_date) AS final_paid_date 
       FROM members m 
       LEFT JOIN dues_records d ON m.id = d.member_id AND d.period = m.period AND d.satker = m.satker 
       WHERE m.satker = ? AND m.period = ? 
       ORDER BY CAST(m.id AS UNSIGNED) ASC, m.id ASC`,
      [satker, period]
    );

    // 2. Fallback: Jika periode ini belum pernah diinput sama sekali oleh cabang
    if (members.length === 0) {
      const [latest] = await query(
        `SELECT period FROM members WHERE satker = ? ORDER BY created_at DESC LIMIT 1`,
        [satker]
      );
      if (latest && latest.period) {
        members = await query(
          `SELECT m.*, 0 AS final_paid, NULL AS final_paid_date 
           FROM members m 
           WHERE m.satker = ? AND m.period = ? 
           ORDER BY CAST(m.id AS UNSIGNED) ASC, m.id ASC`,
          [satker, latest.period]
        );
      }
    }

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
      paid: Boolean(Number(m.final_paid)),
      paidDate: m.final_paid_date || null,
      satker: m.satker,
      period: period,
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
    const currentPeriod = period || "September 2026";
    const currentSatker = satker || "Pengadilan Agama Gunung Sugih";

    // Aksi 1: Toggle bayar per anggota
    if (action === "toggle_paid") {
      const isPaid = paid ? 1 : 0;
      const paidDate = paid ? new Date().toISOString().split("T")[0] : null;

      // Update di tabel members
      await query(
        `UPDATE members SET paid = ?, paid_date = ? 
         WHERE satker = ? AND period = ? AND id = ?`,
        [isPaid, paidDate, currentSatker, currentPeriod, String(memberId)]
      );

      // Sinkronkan ke tabel dues_records
      await query(
        `INSERT INTO dues_records (period, satker, member_id, paid, paid_date)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE paid = VALUES(paid), paid_date = VALUES(paid_date)`,
        [currentPeriod, currentSatker, String(memberId), isPaid, paidDate]
      );

      return NextResponse.json({ success: true });
    }

    // Aksi 2: Simpan seluruh list anggota per periode (Single Sheet Import / Bulk Update)
    if (action === "save_all" && Array.isArray(membersList)) {
      if (membersList.length === 0) return NextResponse.json({ success: true, count: 0 });

      const chunkSize = 50;

      // 1. Batch upsert data anggota ke tabel members dengan isolasi period
      for (let i = 0; i < membersList.length; i += chunkSize) {
        const chunk = membersList.slice(i, i + chunkSize);
        const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
        const flatValues = chunk.flatMap((m, idx) => {
          const mId = String(m.id || m.no || idx + 1);
          const isPaid = typeof m.paid !== "undefined" ? (m.paid ? 1 : 0) : 1;
          const pDate = m.paid ? (m.paidDate || new Date().toISOString().split("T")[0]) : null;
          return [
            mId,
            currentSatker,
            currentPeriod,
            m.nip || "",
            m.name,
            m.title || "",
            m.category || "Hakim",
            Number(m.pusat || 0),
            Number(m.daerah || 0),
            Number(m.cabang || 0),
            Number(m.tournamen || 0),
            isPaid,
            pDate,
            m.phone || "",
          ];
        });

        await query(
          `INSERT INTO members (id, satker, period, nip, name, title, category, pusat, daerah, cabang, tournamen, paid, paid_date, phone)
           VALUES ${placeholders}
           ON DUPLICATE KEY UPDATE 
             nip=VALUES(nip), 
             name=VALUES(name), 
             title=VALUES(title), 
             category=VALUES(category), 
             pusat=VALUES(pusat), 
             daerah=VALUES(daerah), 
             cabang=VALUES(cabang), 
             tournamen=VALUES(tournamen), 
             paid=VALUES(paid), 
             paid_date=VALUES(paid_date), 
             phone=VALUES(phone)`,
          flatValues
        );
      }

      // 2. Batch upsert status iuran ke dues_records
      const recordsToUpsert = membersList
        .filter((m) => typeof m.paid !== "undefined")
        .map((m, idx) => [
          currentPeriod,
          currentSatker,
          String(m.id || m.no || idx + 1),
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
    if ((action === "save_multiple_periods" || action === "save_multi_periods") && Array.isArray(periodsData)) {
      if (periodsData.length === 0) return NextResponse.json({ success: true, count: 0 });

      const chunkSize = 50;

      for (const item of periodsData) {
        const p = item.period;
        const list = Array.isArray(item.members) ? item.members : [];
        if (!p || list.length === 0) continue;

        // 1. Simpan members untuk periode ini
        for (let i = 0; i < list.length; i += chunkSize) {
          const chunk = list.slice(i, i + chunkSize);
          const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
          const flatValues = chunk.flatMap((m, idx) => {
            const mId = String(m.id || m.no || (i + idx + 1));
            const isPaid = typeof m.paid !== "undefined" ? (m.paid ? 1 : 0) : 1;
            const pDate = m.paid ? (m.paidDate || new Date().toISOString().split("T")[0]) : null;
            return [
              mId,
              currentSatker,
              p,
              m.nip || "",
              m.name,
              m.title || "",
              m.category || "Hakim",
              Number(m.pusat || 0),
              Number(m.daerah || 0),
              Number(m.cabang || 0),
              Number(m.tournamen || 0),
              isPaid,
              pDate,
              m.phone || "",
            ];
          });

          await query(
            `INSERT INTO members (id, satker, period, nip, name, title, category, pusat, daerah, cabang, tournamen, paid, paid_date, phone)
             VALUES ${placeholders}
             ON DUPLICATE KEY UPDATE 
               nip=VALUES(nip), 
               name=VALUES(name), 
               title=VALUES(title), 
               category=VALUES(category), 
               pusat=VALUES(pusat), 
               daerah=VALUES(daerah), 
               cabang=VALUES(cabang), 
               tournamen=VALUES(tournamen), 
               paid=VALUES(paid), 
               paid_date=VALUES(paid_date), 
               phone=VALUES(phone)`,
            flatValues
          );
        }

        // 2. Simpan dues_records untuk periode ini
        for (let i = 0; i < list.length; i += chunkSize) {
          const chunk = list.slice(i, i + chunkSize);
          const placeholders = chunk.map(() => "(?, ?, ?, ?, ?)").join(", ");
          const flatValues = chunk.flatMap((m, idx) => {
            const mId = String(m.id || m.no || (i + idx + 1));
            const isPaid = typeof m.paid !== "undefined" ? (m.paid ? 1 : 0) : 1;
            const pDate = m.paid ? (m.paidDate || new Date().toISOString().split("T")[0]) : null;
            return [
              p,
              currentSatker,
              mId,
              isPaid,
              pDate,
            ];
          });

          await query(
            `INSERT INTO dues_records (period, satker, member_id, paid, paid_date)
             VALUES ${placeholders}
             ON DUPLICATE KEY UPDATE paid = VALUES(paid), paid_date = VALUES(paid_date)`,
            flatValues
          );
        }
      }

      return NextResponse.json({
        success: true,
        periodsCount: periodsData.length,
      });
    }

    // Aksi 4: Tambah / Update 1 anggota
    if (action === "upsert_member" && memberData) {
      const id = String(memberData.id || `M-${Date.now()}`);
      const isPaid = memberData.paid ? 1 : 0;
      const pDate = memberData.paid ? (memberData.paidDate || new Date().toISOString().split("T")[0]) : null;

      await query(
        `INSERT INTO members (id, satker, period, nip, name, title, category, pusat, daerah, cabang, tournamen, paid, paid_date, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           nip=VALUES(nip), 
           name=VALUES(name), 
           title=VALUES(title), 
           category=VALUES(category), 
           pusat=VALUES(pusat), 
           daerah=VALUES(daerah), 
           cabang=VALUES(cabang), 
           tournamen=VALUES(tournamen), 
           paid=VALUES(paid), 
           paid_date=VALUES(paid_date), 
           phone=VALUES(phone)`,
        [
          id,
          currentSatker,
          currentPeriod,
          memberData.nip || "",
          memberData.name,
          memberData.title || "",
          memberData.category || "Hakim",
          memberData.pusat || 0,
          memberData.daerah || 0,
          memberData.cabang || 0,
          memberData.tournamen || 0,
          isPaid,
          pDate,
          memberData.phone || "",
        ]
      );

      await query(
        `INSERT INTO dues_records (period, satker, member_id, paid, paid_date)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE paid = VALUES(paid), paid_date = VALUES(paid_date)`,
        [currentPeriod, currentSatker, id, isPaid, pDate]
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
      await query("DELETE FROM members WHERE satker = ? AND period = ?", [satker, period]);
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
