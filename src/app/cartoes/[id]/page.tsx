import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { calcularFatura } from "@/lib/billing";
import { rowToCartao, rowToCompra } from "@/lib/data";
import CartaoDetalhe from "@/components/CartaoDetalhe";

export const dynamic = "force-dynamic";

export default async function CartaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();
  const cartaoRes = await db.execute({
    sql: "SELECT * FROM cartoes WHERE id = ?",
    args: [Number(id)],
  });
  if (cartaoRes.rows.length === 0) {
    notFound();
  }
  const cartao = rowToCartao(cartaoRes.rows[0]);
  const comprasRes = await db.execute({
    sql: "SELECT * FROM compras WHERE cartao_id = ? ORDER BY data DESC, id DESC",
    args: [cartao.id],
  });
  const compras = comprasRes.rows.map(rowToCompra);
  const fatura = calcularFatura(cartao, compras);

  return <CartaoDetalhe cartao={cartao} compras={compras} fatura={fatura} />;
}
