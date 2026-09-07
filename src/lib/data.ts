import { getDb } from "./db";
import { calcularFatura } from "./billing";
import { Cartao, Compra, FaturaResumo } from "./types";

export function rowToCartao(row: any): Cartao {
  return {
    id: Number(row.id),
    nome: row.nome,
    bandeira: row.bandeira,
    final: row.final,
    limite: Number(row.limite),
    diaFechamento: Number(row.dia_fechamento),
    diaVencimento: Number(row.dia_vencimento),
    cor: row.cor,
    criadoEm: row.criado_em,
  };
}

export function rowToCompra(row: any): Compra {
  return {
    id: Number(row.id),
    cartaoId: Number(row.cartao_id),
    descricao: row.descricao,
    categoria: row.categoria,
    valorTotal: Number(row.valor_total),
    parcelas: Number(row.parcelas),
    data: row.data,
    fonte: row.fonte,
    criadoEm: row.criado_em,
  };
}

export interface CartaoComFatura {
  cartao: Cartao;
  compras: Compra[];
  fatura: FaturaResumo;
}

export async function listarCartoesComFatura(): Promise<CartaoComFatura[]> {
  const db = await getDb();
  const cartoesRes = await db.execute(
    "SELECT * FROM cartoes ORDER BY nome COLLATE NOCASE ASC"
  );
  const cartoes = cartoesRes.rows.map(rowToCartao);
  const comprasRes = await db.execute("SELECT * FROM compras");
  const todasCompras = comprasRes.rows.map(rowToCompra);

  return cartoes.map((cartao) => {
    const compras = todasCompras.filter((c) => c.cartaoId === cartao.id);
    return { cartao, compras, fatura: calcularFatura(cartao, compras) };
  });
}
