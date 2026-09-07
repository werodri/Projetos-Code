import { Cartao, Compra, FaturaResumo } from "./types";

function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

/** Retorna uma data válida usando o dia informado, ajustando para o último dia do mês se necessário. */
function dateForDay(year: number, month1to12: number, day: number): Date {
  const clamped = Math.min(day, daysInMonth(year, month1to12));
  return new Date(year, month1to12 - 1, clamped, 0, 0, 0, 0);
}

function addMonthsToYm(year: number, month1to12: number, offset: number) {
  const total = year * 12 + (month1to12 - 1) + offset;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

/** Data de fechamento do ciclo que contém `referencia`. */
function getCycleEnd(referencia: Date, diaFechamento: number): Date {
  const y = referencia.getFullYear();
  const m = referencia.getMonth() + 1;
  const closingThisMonth = dateForDay(y, m, diaFechamento);
  if (referencia.getTime() <= closingThisMonth.getTime()) {
    return closingThisMonth;
  }
  const next = addMonthsToYm(y, m, 1);
  return dateForDay(next.year, next.month, diaFechamento);
}

function getCycleStart(cycleEnd: Date, diaFechamento: number): Date {
  const y = cycleEnd.getFullYear();
  const m = cycleEnd.getMonth() + 1;
  const prev = addMonthsToYm(y, m, -1);
  const prevClose = dateForDay(prev.year, prev.month, diaFechamento);
  const start = new Date(prevClose);
  start.setDate(start.getDate() + 1);
  return start;
}

function getDueDate(
  cycleEnd: Date,
  diaFechamento: number,
  diaVencimento: number
): Date {
  const y = cycleEnd.getFullYear();
  const m = cycleEnd.getMonth() + 1;
  if (diaVencimento <= diaFechamento) {
    const next = addMonthsToYm(y, m, 1);
    return dateForDay(next.year, next.month, diaVencimento);
  }
  return dateForDay(y, m, diaVencimento);
}

function cycleEndForOffset(
  firstCycleEnd: Date,
  diaFechamento: number,
  offset: number
): Date {
  if (offset === 0) return firstCycleEnd;
  const y = firstCycleEnd.getFullYear();
  const m = firstCycleEnd.getMonth() + 1;
  const shifted = addMonthsToYm(y, m, offset);
  return dateForDay(shifted.year, shifted.month, diaFechamento);
}

function cycleKey(cycleEnd: Date): string {
  const y = cycleEnd.getFullYear();
  const m = String(cycleEnd.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Divide o valor total em parcelas (em centavos) sem perder centavos por arredondamento. */
function splitInstallments(valorTotal: number, parcelas: number): number[] {
  const totalCents = Math.round(valorTotal * 100);
  const base = Math.floor(totalCents / parcelas);
  const resto = totalCents - base * parcelas;
  const result: number[] = [];
  for (let i = 0; i < parcelas; i++) {
    const cents = base + (i < resto ? 1 : 0);
    result.push(cents / 100);
  }
  return result;
}

interface ParcelaCalculada {
  compraId: number;
  numero: number; // 1-indexed
  valor: number;
  cicloFim: Date;
  cicloChave: string;
  vencimento: Date;
  pago: boolean;
}

function calcularParcelas(
  compra: Compra,
  cartao: Cartao,
  hoje: Date
): ParcelaCalculada[] {
  const dataCompra = new Date(compra.data + "T00:00:00");
  const primeiroCicloFim = getCycleEnd(dataCompra, cartao.diaFechamento);
  const valores = splitInstallments(compra.valorTotal, compra.parcelas);
  const parcelas: ParcelaCalculada[] = [];
  for (let i = 0; i < compra.parcelas; i++) {
    const cicloFim = cycleEndForOffset(primeiroCicloFim, cartao.diaFechamento, i);
    const vencimento = getDueDate(cicloFim, cartao.diaFechamento, cartao.diaVencimento);
    parcelas.push({
      compraId: compra.id,
      numero: i + 1,
      valor: valores[i],
      cicloFim,
      cicloChave: cycleKey(cicloFim),
      vencimento,
      pago: vencimento.getTime() < hoje.getTime(),
    });
  }
  return parcelas;
}

export function calcularFatura(
  cartao: Cartao,
  compras: Compra[],
  hoje: Date = new Date()
): FaturaResumo {
  const todasParcelas = compras.flatMap((c) => calcularParcelas(c, cartao, hoje));

  const cicloAtualFim = getCycleEnd(hoje, cartao.diaFechamento);
  const cicloAtualInicio = getCycleStart(cicloAtualFim, cartao.diaFechamento);
  const cicloAtualChave = cycleKey(cicloAtualFim);
  const vencimentoCicloAtual = getDueDate(
    cicloAtualFim,
    cartao.diaFechamento,
    cartao.diaVencimento
  );

  const anterior = addMonthsToYm(
    cicloAtualFim.getFullYear(),
    cicloAtualFim.getMonth() + 1,
    -1
  );
  const cicloAnteriorFim = dateForDay(anterior.year, anterior.month, cartao.diaFechamento);
  const cicloAnteriorChave = cycleKey(cicloAnteriorFim);
  const vencimentoAnterior = getDueDate(
    cicloAnteriorFim,
    cartao.diaFechamento,
    cartao.diaVencimento
  );

  const faturaFechadaPendente = vencimentoAnterior.getTime() >= hoje.getTime();

  const totalFaturaAtual = faturaFechadaPendente
    ? todasParcelas
        .filter((p) => p.cicloChave === cicloAnteriorChave)
        .reduce((s, p) => s + p.valor, 0)
    : 0;

  const totalFaturaAberta = todasParcelas
    .filter((p) => p.cicloChave === cicloAtualChave)
    .reduce((s, p) => s + p.valor, 0);

  const saldoDevedor = todasParcelas
    .filter((p) => !p.pago)
    .reduce((s, p) => s + p.valor, 0);

  const limiteDisponivel = Math.max(0, cartao.limite - saldoDevedor);
  const percentualUsado =
    cartao.limite > 0 ? Math.min(999, (saldoDevedor / cartao.limite) * 100) : 0;

  const melhorData = new Date(cicloAtualFim);
  melhorData.setDate(melhorData.getDate() + 1);

  return {
    cicloChaveAtual: cicloAtualChave,
    inicioCiclo: cicloAtualInicio.toISOString().slice(0, 10),
    fimCiclo: cicloAtualFim.toISOString().slice(0, 10),
    vencimento: (faturaFechadaPendente ? vencimentoAnterior : vencimentoCicloAtual)
      .toISOString()
      .slice(0, 10),
    totalFaturaAtual,
    totalFaturaAberta,
    saldoDevedor,
    limiteDisponivel,
    melhorDiaCompra: melhorData.getDate(),
    percentualUsado,
  };
}
