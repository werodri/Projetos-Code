export type FonteCompra = "manual" | "foto" | "voz";

export interface Cartao {
  id: number;
  nome: string;
  bandeira: string | null;
  final: string | null;
  limite: number;
  diaFechamento: number; // 1-31
  diaVencimento: number; // 1-31
  cor: string;
  criadoEm: string;
}

export interface Compra {
  id: number;
  cartaoId: number;
  descricao: string;
  categoria: string | null;
  valorTotal: number;
  parcelas: number;
  data: string; // ISO yyyy-MM-dd
  fonte: FonteCompra;
  criadoEm: string;
}

export interface FaturaResumo {
  cicloChaveAtual: string; // "YYYY-MM"
  inicioCiclo: string;
  fimCiclo: string;
  vencimento: string;
  totalFaturaAtual: number;
  totalFaturaAberta: number; // ciclo em formação (após fechamento até hoje)
  saldoDevedor: number; // soma de todas as parcelas ainda não vencidas
  limiteDisponivel: number;
  melhorDiaCompra: number;
  percentualUsado: number;
}
