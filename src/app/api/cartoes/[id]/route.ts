import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { Cartao } from "@/lib/types";

function rowToCartao(row: any): Cartao {
  return {
    id: row.id,
    nome: row.nome,
    bandeira: row.bandeira,
    final: row.final,
    limite: row.limite,
    diaFechamento: row.dia_fechamento,
    diaVencimento: row.dia_vencimento,
    cor: row.cor,
    criadoEm: row.criado_em,
  };
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = getDb();
  const row = db.prepare("SELECT * FROM cartoes WHERE id = ?").get(Number(id));
  if (!row) {
    return NextResponse.json({ erro: "Cartão não encontrado." }, { status: 404 });
  }
  return NextResponse.json(rowToCartao(row));
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const existente = db.prepare("SELECT * FROM cartoes WHERE id = ?").get(Number(id));
  if (!existente) {
    return NextResponse.json({ erro: "Cartão não encontrado." }, { status: 404 });
  }

  const nome = body.nome?.trim() || (existente as any).nome;
  const bandeira = body.bandeira !== undefined ? body.bandeira?.trim() || null : (existente as any).bandeira;
  const final = body.final !== undefined ? body.final?.trim() || null : (existente as any).final;
  const limite = body.limite !== undefined ? Number(body.limite) : (existente as any).limite;
  const diaFechamento =
    body.diaFechamento !== undefined ? Number(body.diaFechamento) : (existente as any).dia_fechamento;
  const diaVencimento =
    body.diaVencimento !== undefined ? Number(body.diaVencimento) : (existente as any).dia_vencimento;
  const cor = body.cor || (existente as any).cor;

  db.prepare(
    `UPDATE cartoes SET nome = ?, bandeira = ?, final = ?, limite = ?, dia_fechamento = ?, dia_vencimento = ?, cor = ?
     WHERE id = ?`
  ).run(nome, bandeira, final, limite, diaFechamento, diaVencimento, cor, Number(id));

  const atualizado = db.prepare("SELECT * FROM cartoes WHERE id = ?").get(Number(id));
  return NextResponse.json(rowToCartao(atualizado));
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM compras WHERE cartao_id = ?").run(Number(id));
  db.prepare("DELETE FROM cartoes WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}
