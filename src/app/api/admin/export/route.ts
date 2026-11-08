import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAllEnrollments, enrollmentsToCsv } from "@/lib/admin";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!session.user.isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const rows = await getAllEnrollments();
  const csv = enrollmentsToCsv(rows);
  const bom = "﻿"; // ajuda o Excel a reconhecer acentos em UTF-8

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inscritos-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
