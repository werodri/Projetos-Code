import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { Compra, FonteCompra } from "@/lib/types";

function rowToCompra(row: any): Compra {
  return {
    id: row.id,
    cartaoId: row.cartao_id,
    descricao: row.descricao,
    categoria: row.categoria,
    valorTotal: row.valor_total,
    parcelas: row.parcelas,
    data: row.data,
    fonte: row.fonte as FonteCompra,
    criadoEm: row.criado_em,
  };
}

export async function GET(req: NextRequest) {
  const cartaoId = req.nextUrl.searchParams.get("cartaoId");
  const db = getDb();
  const rows = cartaoId
    ? db
        .prepare("SELECT * FROM compras WHERE cartao_id = ? ORDER BY data DESC, id DESC")
        .all(Number(cartaoId))
    : db.prepare("SELECT * FROM compras ORDER BY data DESC, id DESC").all();
  return NextResponse.json(rows.map(rowToCompra));
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

  const db = getDb();
  const cartao = db.prepare("SELECT id FROM cartoes WHERE id = ?").get(cartaoIdNum);
  if (!cartao) {
    return NextResponse.json({ erro: "Cartão não encontrado." }, { status: 404 });
  }

  const fonteValida: FonteCompra = ["manual", "foto", "voz"].includes(fonte) ? fonte : "manual";

  const result = db
    .prepare(
      `INSERT INTO compras (cartao_id, descricao, categoria, valor_total, parcelas, data, fonte)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(cartaoIdNum, descricao.trim(), categoria?.trim() || null, valorNum, parcelasNum, data, fonteValida);

  const nova = db.prepare("SELECT * FROM compras WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json(rowToCompra(nova), { status: 201 });
}
