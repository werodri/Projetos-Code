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
  const db = getDb();
  const row = db.prepare("SELECT * FROM cartoes WHERE id = ?").get(Number(id));
  if (!row) {
    notFound();
  }
  const cartao = rowToCartao(row);
  const compras = db
    .prepare("SELECT * FROM compras WHERE cartao_id = ? ORDER BY data DESC, id DESC")
    .all(cartao.id)
    .map(rowToCompra);
  const fatura = calcularFatura(cartao, compras);

  return <CartaoDetalhe cartao={cartao} compras={compras} fatura={fatura} />;
}
