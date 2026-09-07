import { listarCartoesComFatura } from "@/lib/data";
import CartoesGrid from "@/components/CartoesGrid";

export const dynamic = "force-dynamic";

export default async function CartoesPage() {
  const resumos = await listarCartoesComFatura();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Meus cartões</h1>
          <p className="text-sm text-slate-500">
            {resumos.length} cartão(ões) cadastrado(s) — sem limite de quantidade.
          </p>
        </div>
      </div>
      <CartoesGrid resumos={resumos} />
    </div>
  );
}
