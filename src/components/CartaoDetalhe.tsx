"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Cartao, Compra, FaturaResumo } from "@/lib/types";
import { formatarMoeda, formatarData } from "@/lib/format";
import NovaCompraModal from "./NovaCompraModal";
import EditarCartaoModal from "./EditarCartaoModal";

const ICONE_FONTE: Record<string, string> = {
  manual: "⌨️",
  foto: "📷",
  voz: "🎙️",
};

export default function CartaoDetalhe({
  cartao,
  compras,
  fatura,
}: {
  cartao: Cartao;
  compras: Compra[];
  fatura: FaturaResumo;
}) {
  const [modalCompra, setModalCompra] = useState(false);
  const [modalEdicao, setModalEdicao] = useState(false);
  const router = useRouter();

  async function excluirCompra(id: number) {
    if (!confirm("Excluir esta compra?")) return;
    await fetch(`/api/compras/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function excluirCartao() {
    if (!confirm(`Excluir o cartão "${cartao.nome}" e todas as suas compras?`)) return;
    await fetch(`/api/cartoes/${cartao.id}`, { method: "DELETE" });
    router.push("/cartoes");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card-surface flex flex-wrap items-start justify-between gap-4 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: cartao.cor }} />
          <div>
            <h1 className="text-xl font-semibold text-slate-800">{cartao.nome}</h1>
            <p className="text-sm text-slate-500">
              {cartao.bandeira && <span>{cartao.bandeira} · </span>}
              {cartao.final && <span>•••• {cartao.final} · </span>}
              Fecha dia {cartao.diaFechamento} · Vence dia {cartao.diaVencimento}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setModalEdicao(true)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Editar
          </button>
          <button
            onClick={excluirCartao}
            className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            Excluir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Limite total" valor={formatarMoeda(cartao.limite)} />
        <StatCard
          label="Limite disponível"
          valor={formatarMoeda(fatura.limiteDisponivel)}
          destaque="emerald"
        />
        <StatCard
          label={fatura.totalFaturaAtual > 0 ? "Fatura a pagar" : "Nenhuma fatura pendente"}
          valor={
            fatura.totalFaturaAtual > 0
              ? `${formatarMoeda(fatura.totalFaturaAtual)}`
              : "—"
          }
          sub={fatura.totalFaturaAtual > 0 ? `Vence em ${formatarData(fatura.vencimento)}` : undefined}
          destaque={fatura.totalFaturaAtual > 0 ? "rose" : undefined}
        />
        <StatCard
          label="Melhor dia para comprar"
          valor={`Dia ${fatura.melhorDiaCompra}`}
          sub="Maior prazo até o pagamento"
        />
      </div>

      <div className="card-surface rounded-2xl p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600">Limite comprometido</span>
          <span className="text-slate-500">{fatura.percentualUsado.toFixed(0)}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
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
        <p className="mt-2 text-xs text-slate-500">
          Fatura em formação (ciclo atual, {formatarData(fatura.inicioCiclo)} a{" "}
          {formatarData(fatura.fimCiclo)}): <b>{formatarMoeda(fatura.totalFaturaAberta)}</b>
        </p>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Compras</h2>
          <button
            onClick={() => setModalCompra(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            + Lançar compra
          </button>
        </div>

        {compras.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Nenhuma compra lançada neste cartão ainda.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Data</th>
                  <th className="px-4 py-2">Descrição</th>
                  <th className="px-4 py-2">Categoria</th>
                  <th className="px-4 py-2">Parcelas</th>
                  <th className="px-4 py-2">Origem</th>
                  <th className="px-4 py-2 text-right">Valor</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {compras.map((compra) => (
                  <tr key={compra.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 text-slate-600">{formatarData(compra.data)}</td>
                    <td className="px-4 py-2 font-medium text-slate-800">{compra.descricao}</td>
                    <td className="px-4 py-2 text-slate-500">{compra.categoria || "—"}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {compra.parcelas > 1 ? `${compra.parcelas}x` : "à vista"}
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {ICONE_FONTE[compra.fonte]} {compra.fonte}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-slate-800">
                      {formatarMoeda(compra.valorTotal)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => excluirCompra(compra.id)}
                        className="text-xs text-rose-500 hover:underline"
                      >
                        excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalCompra && (
        <NovaCompraModal
          cartaoId={cartao.id}
          onClose={() => setModalCompra(false)}
          onCriada={() => {
            setModalCompra(false);
            router.refresh();
          }}
        />
      )}
      {modalEdicao && (
        <EditarCartaoModal
          cartao={cartao}
          onClose={() => setModalEdicao(false)}
          onSalvo={() => {
            setModalEdicao(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  valor,
  sub,
  destaque,
}: {
  label: string;
  valor: string;
  sub?: string;
  destaque?: "emerald" | "rose";
}) {
  const cor =
    destaque === "emerald" ? "text-emerald-600" : destaque === "rose" ? "text-rose-600" : "text-slate-800";
  return (
    <div className="card-surface rounded-2xl p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-xl font-bold ${cor}`}>{valor}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
