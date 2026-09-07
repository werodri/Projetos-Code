import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rowToCartao } from "@/lib/data";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM cartoes WHERE id = ?",
    args: [Number(id)],
  });
  if (result.rows.length === 0) {
    return NextResponse.json({ erro: "Cartão não encontrado." }, { status: 404 });
  }
  return NextResponse.json(rowToCartao(result.rows[0]));
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const db = await getDb();

  const existenteRes = await db.execute({
    sql: "SELECT * FROM cartoes WHERE id = ?",
    args: [Number(id)],
  });
  if (existenteRes.rows.length === 0) {
    return NextResponse.json({ erro: "Cartão não encontrado." }, { status: 404 });
  }
  const existente = existenteRes.rows[0] as any;

  const nome = body.nome?.trim() || existente.nome;
  const bandeira = body.bandeira !== undefined ? body.bandeira?.trim() || null : existente.bandeira;
  const final = body.final !== undefined ? body.final?.trim() || null : existente.final;
  const limite = body.limite !== undefined ? Number(body.limite) : Number(existente.limite);
  const diaFechamento =
    body.diaFechamento !== undefined ? Number(body.diaFechamento) : Number(existente.dia_fechamento);
  const diaVencimento =
    body.diaVencimento !== undefined ? Number(body.diaVencimento) : Number(existente.dia_vencimento);
  const cor = body.cor || existente.cor;

  const result = await db.execute({
    sql: `UPDATE cartoes SET nome = ?, bandeira = ?, final = ?, limite = ?, dia_fechamento = ?, dia_vencimento = ?, cor = ?
          WHERE id = ? RETURNING *`,
    args: [nome, bandeira, final, limite, diaFechamento, diaVencimento, cor, Number(id)],
  });

  return NextResponse.json(rowToCartao(result.rows[0]));
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM compras WHERE cartao_id = ?", args: [Number(id)] });
  await db.execute({ sql: "DELETE FROM cartoes WHERE id = ?", args: [Number(id)] });
  return NextResponse.json({ ok: true });
}
