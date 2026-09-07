import Link from "next/link";
import { listarCartoesComFatura } from "@/lib/data";
import { formatarMoeda, formatarData } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const resumos = await listarCartoesComFatura();
  const cartoes = resumos.map((r) => r.cartao);

  if (cartoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
        <p className="text-4xl">💳</p>
        <h1 className="mt-4 text-xl font-semibold text-slate-800">
          Nenhum cartão cadastrado ainda
        </h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Cadastre seus cartões (limite, fechamento e vencimento) para começar a
          acompanhar suas faturas e lançar compras.
        </p>
        <Link
          href="/cartoes"
          className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Cadastrar meu primeiro cartão
        </Link>
      </div>
    );
  }

  const limiteTotal = cartoes.reduce((s, c) => s + c.limite, 0);
  const saldoDevedorTotal = resumos.reduce((s, r) => s + r.fatura.saldoDevedor, 0);
  const disponivelTotal = Math.max(0, limiteTotal - saldoDevedorTotal);
  const faturasAPagarTotal = resumos.reduce((s, r) => s + r.fatura.totalFaturaAtual, 0);

  const atencao = resumos
    .filter((r) => r.fatura.percentualUsado >= 80 || r.fatura.totalFaturaAtual > 0)
    .sort((a, b) => {
      const va = a.fatura.totalFaturaAtual > 0 ? new Date(a.fatura.vencimento).getTime() : Infinity;
      const vb = b.fatura.totalFaturaAtual > 0 ? new Date(b.fatura.vencimento).getTime() : Infinity;
      if (va !== vb) return va - vb;
      return b.fatura.percentualUsado - a.fatura.percentualUsado;
    })
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-surface rounded-2xl p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Limite total ({cartoes.length} cartões)
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-800">{formatarMoeda(limiteTotal)}</p>
        </div>
        <div className="card-surface rounded-2xl p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Disponível agora
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatarMoeda(disponivelTotal)}
          </p>
        </div>
        <div className="card-surface rounded-2xl p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Faturas fechadas a pagar
          </p>
          <p className="mt-2 text-2xl font-bold text-rose-600">
            {formatarMoeda(faturasAPagarTotal)}
          </p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Precisa da sua atenção</h2>
          <Link href="/cartoes" className="text-sm font-medium text-brand-600 hover:underline">
            Ver todos os cartões →
          </Link>
        </div>
        {atencao.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            Nenhuma fatura pendente ou limite alto no momento. 🎉
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {atencao.map(({ cartao, fatura }) => (
              <Link
                key={cartao.id}
                href={`/cartoes/${cartao.id}`}
                className="card-surface flex flex-col gap-2 rounded-xl p-4 transition hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cartao.cor }}
                  />
                  <span className="font-semibold text-slate-800">{cartao.nome}</span>
                </div>
                {fatura.totalFaturaAtual > 0 && (
                  <p className="text-sm text-slate-600">
                    Fatura de <b>{formatarMoeda(fatura.totalFaturaAtual)}</b> vence em{" "}
                    <b>{formatarData(fatura.vencimento)}</b>
                  </p>
                )}
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full ${
                      fatura.percentualUsado >= 100
                        ? "bg-rose-500"
                        : fatura.percentualUsado >= 80
                          ? "bg-amber-500"
                          : "bg-brand-500"
                    }`}
                    style={{ width: `${Math.min(100, fatura.percentualUsado)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {fatura.percentualUsado.toFixed(0)}% do limite comprometido
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
