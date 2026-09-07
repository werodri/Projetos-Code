import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rowToCompra } from "@/lib/data";
import { FonteCompra } from "@/lib/types";

export async function GET(req: NextRequest) {
  const cartaoId = req.nextUrl.searchParams.get("cartaoId");
  const db = await getDb();
  const result = cartaoId
    ? await db.execute({
        sql: "SELECT * FROM compras WHERE cartao_id = ? ORDER BY data DESC, id DESC",
        args: [Number(cartaoId)],
      })
    : await db.execute("SELECT * FROM compras ORDER BY data DESC, id DESC");
  return NextResponse.json(result.rows.map(rowToCompra));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { cartaoId, descricao, categoria, valorTotal, parcelas, data, fonte } = body;

  const cartaoIdNum = Number(cartaoId);
  const valorNum = Number(valorTotal);
  const parcelasNum = Number(parcelas) || 1;

  if (!cartaoIdNum) {
    return NextResponse.json({ erro: "Cartão é obrigatório." }, { status: 400 });
  }
  if (!descricao || typeof descricao !== "string" || !descricao.trim()) {
    return NextResponse.json({ erro: "Descrição é obrigatória." }, { status: 400 });
  }
  if (!Number.isFinite(valorNum) || valorNum <= 0) {
    return NextResponse.json({ erro: "Valor inválido." }, { status: 400 });
  }
  if (!Number.isInteger(parcelasNum) || parcelasNum < 1 || parcelasNum > 48) {
    return NextResponse.json({ erro: "Número de parcelas inválido." }, { status: 400 });
  }
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return NextResponse.json({ erro: "Data inválida." }, { status: 400 });
  }

  const db = await getDb();
  const cartaoRes = await db.execute({
    sql: "SELECT id FROM cartoes WHERE id = ?",
    args: [cartaoIdNum],
  });
  if (cartaoRes.rows.length === 0) {
    return NextResponse.json({ erro: "Cartão não encontrado." }, { status: 404 });
  }

  const fonteValida: FonteCompra = ["manual", "foto", "voz"].includes(fonte) ? fonte : "manual";

  const result = await db.execute({
    sql: `INSERT INTO compras (cartao_id, descricao, categoria, valor_total, parcelas, data, fonte)
          VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [
      cartaoIdNum,
      descricao.trim(),
      categoria?.trim() || null,
      valorNum,
      parcelasNum,
      data,
      fonteValida,
    ],
  });

  return NextResponse.json(rowToCompra(result.rows[0]), { status: 201 });
}
