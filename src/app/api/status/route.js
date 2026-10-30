import { NextResponse } from "next/server";
import { checkConnection, query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const conn = await checkConnection();
  if (!conn.ok) {
    return NextResponse.json({ success: false, connected: false, error: conn.error });
  }

  try {
    const [satkerCount] = await query("SELECT COUNT(*) AS total FROM satker");
    const [usersCount] = await query("SELECT COUNT(*) AS total FROM users");
    const [reqCount] = await query("SELECT COUNT(*) AS total FROM account_requests");
    const [memCount] = await query("SELECT COUNT(*) AS total FROM members");

    return NextResponse.json({
      success: true,
      connected: true,
      database: "db_ptwp",
      counts: {
        satker: satkerCount?.total || 0,
        users: usersCount?.total || 0,
        requests: reqCount?.total || 0,
        members: memCount?.total || 0,
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, connected: false, error: err.message }, { status: 500 });
  }
}
