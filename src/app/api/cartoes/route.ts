import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rowToCartao } from "@/lib/data";

export async function GET() {
  const db = await getDb();
  const result = await db.execute(
    "SELECT * FROM cartoes ORDER BY nome COLLATE NOCASE ASC"
  );
  return NextResponse.json(result.rows.map(rowToCartao));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nome, bandeira, final, limite, diaFechamento, diaVencimento, cor } = body;

  if (!nome || typeof nome !== "string" || !nome.trim()) {
    return NextResponse.json({ erro: "Nome do cartão é obrigatório." }, { status: 400 });
  }
  const limiteNum = Number(limite);
  const fechamentoNum = Number(diaFechamento);
  const vencimentoNum = Number(diaVencimento);
  if (!Number.isFinite(limiteNum) || limiteNum < 0) {
    return NextResponse.json({ erro: "Limite inválido." }, { status: 400 });
  }
  if (!Number.isInteger(fechamentoNum) || fechamentoNum < 1 || fechamentoNum > 31) {
    return NextResponse.json({ erro: "Dia de fechamento inválido (1-31)." }, { status: 400 });
  }
  if (!Number.isInteger(vencimentoNum) || vencimentoNum < 1 || vencimentoNum > 31) {
    return NextResponse.json({ erro: "Dia de vencimento inválido (1-31)." }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.execute({
    sql: `INSERT INTO cartoes (nome, bandeira, final, limite, dia_fechamento, dia_vencimento, cor)
          VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [
      nome.trim(),
      bandeira?.trim() || null,
      final?.trim() || null,
      limiteNum,
      fechamentoNum,
      vencimentoNum,
      cor || "#6366f1",
    ],
  });

  return NextResponse.json(rowToCartao(result.rows[0]), { status: 201 });
}
