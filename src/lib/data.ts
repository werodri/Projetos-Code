import { getDb } from "./db";
import { calcularFatura } from "./billing";
import { Cartao, Compra, FaturaResumo } from "./types";

export function rowToCartao(row: any): Cartao {
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

export function rowToCompra(row: any): Compra {
  return {
    id: row.id,
    cartaoId: row.cartao_id,
    descricao: row.descricao,
    categoria: row.categoria,
    valorTotal: row.valor_total,
    parcelas: row.parcelas,
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

export function listarCartoesComFatura(): CartaoComFatura[] {
  const db = getDb();
  const cartoes = db
    .prepare("SELECT * FROM cartoes ORDER BY nome COLLATE NOCASE ASC")
    .all()
    .map(rowToCartao);
  const todasCompras = db.prepare("SELECT * FROM compras").all().map(rowToCompra);

  return cartoes.map((cartao) => {
    const compras = todasCompras.filter((c) => c.cartaoId === cartao.id);
    return { cartao, compras, fatura: calcularFatura(cartao, compras) };
  });
}
