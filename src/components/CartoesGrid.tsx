"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CartaoComFatura } from "@/lib/data";
import { formatarMoeda } from "@/lib/format";
import NovoCartaoModal from "./NovoCartaoModal";

export default function CartoesGrid({ resumos }: { resumos: CartaoComFatura[] }) {
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const router = useRouter();

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return resumos;
    return resumos.filter(
      ({ cartao }) =>
        cartao.nome.toLowerCase().includes(termo) ||
        (cartao.bandeira ?? "").toLowerCase().includes(termo) ||
        (cartao.final ?? "").includes(termo)
    );
  }, [resumos, busca]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Buscar por nome, bandeira ou final..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          onClick={() => setModalAberto(true)}
          className="whitespace-nowrap rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Novo cartão
        </button>
      </div>

      {filtrados.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Nenhum cartão encontrado.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map(({ cartao, fatura }) => (
            <Link
              key={cartao.id}
              href={`/cartoes/${cartao.id}`}
              className="card-surface flex flex-col gap-3 rounded-xl p-4 transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cartao.cor }} />
                  <span className="font-semibold text-slate-800">{cartao.nome}</span>
                </div>
                {cartao.final && (
                  <span className="text-xs text-slate-400">•••• {cartao.final}</span>
                )}
              </div>
              <div className="text-xs text-slate-500">
                Fecha dia {cartao.diaFechamento} · Vence dia {cartao.diaVencimento}
              </div>
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
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Disponível</span>
                <span className="font-semibold text-emerald-600">
                  {formatarMoeda(fatura.limiteDisponivel)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Limite {formatarMoeda(cartao.limite)}</span>
                <span>{fatura.percentualUsado.toFixed(0)}% usado</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {modalAberto && (
        <NovoCartaoModal
          onClose={() => setModalAberto(false)}
          onCriado={() => {
            setModalAberto(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
