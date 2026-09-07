import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM compras WHERE id = ?", args: [Number(id)] });
  return NextResponse.json({ ok: true });
}
