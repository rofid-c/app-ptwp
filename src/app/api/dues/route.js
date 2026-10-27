// Endpoint API Route Next.js untuk Data Iuran PTWP
// Siap dihubungkan ke Database (PostgreSQL / MySQL / Supabase / Prisma)

import { NextResponse } from "next/server";
import { INITIAL_MEMBERS } from "@/data/initialMembers";

export const dynamic = "force-dynamic";

// In-memory fallback untuk environment serverless
let serverSideDuesStore = {};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "September 2026";

  const data = serverSideDuesStore[period] || [];

  return NextResponse.json({
    success: true,
    period,
    totalRecords: data.length,
    data,
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { period, members } = body;

    if (!period || !members) {
      return NextResponse.json(
        { success: false, message: "Parameter period dan members wajib diisi." },
        { status: 400 }
      );
    }

    serverSideDuesStore[period] = members;

    return NextResponse.json({
      success: true,
      message: `Data iuran periode ${period} berhasil disimpan.`,
      period,
      count: members.length,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message || "Gagal memproses data." },
      { status: 500 }
    );
  }
}
