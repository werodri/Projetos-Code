"use client";

import { useRef, useState } from "react";

type Aba = "digitar" | "foto" | "voz";
type Fonte = "manual" | "foto" | "voz";

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function blobParaBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const resultado = reader.result as string;
      resolve(resultado.split(",")[1] ?? resultado);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function NovaCompraModal({
  cartaoId,
  onClose,
  onCriada,
}: {
  cartaoId: number;
  onClose: () => void;
  onCriada: () => void;
}) {
  const [aba, setAba] = useState<Aba>("digitar");
  const [fonte, setFonte] = useState<Fonte>("manual");

  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(hojeISO());
  const [parcelas, setParcelas] = useState("1");

  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [textoReconhecido, setTextoReconhecido] = useState<string | null>(null);
  const [extraindo, setExtraindo] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(null);
    setFotoPreview(URL.createObjectURL(file));
    setExtraindo(true);
    try {
      const base64 = await blobParaBase64(file);
      const res = await fetch("/api/extrair/foto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagemBase64: base64 }),
      });
      const dados = await res.json();
      aplicarExtracao(dados, "foto");
    } catch {
      setErro("Não foi possível processar a imagem.");
    } finally {
      setExtraindo(false);
    }
  }

  function aplicarExtracao(dados: any, origem: Fonte) {
    if (dados.descricaoSugerida) setDescricao(dados.descricaoSugerida);
    if (dados.valorSugerido != null) setValor(String(dados.valorSugerido));
    if (dados.dataSugerida) setData(dados.dataSugerida);
    if (dados.categoriaSugerida) setCategoria(dados.categoriaSugerida);
    setTextoReconhecido(dados.textoReconhecido ?? null);
    setFonte(origem);
  }

  async function iniciarGravacao() {
    setErro(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setExtraindo(true);
        try {
          const base64 = await blobParaBase64(blob);
          const res = await fetch("/api/extrair/voz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64: base64 }),
          });
          const dados = await res.json();
          aplicarExtracao(dados, "voz");
        } catch {
          setErro("Não foi possível processar o áudio.");
        } finally {
          setExtraindo(false);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setGravando(true);
    } catch {
      setErro("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    }
  }

  function pararGravacao() {
    mediaRecorderRef.current?.stop();
    setGravando(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartaoId,
          descricao,
          categoria,
          valorTotal: parseFloat(valor.replace(",", ".")),
          parcelas: parseInt(parcelas, 10) || 1,
          data,
          fonte,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setErro(d.erro || "Erro ao salvar compra.");
        return;
      }
      onCriada();
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setEnviando(false);
    }
  }

  function trocarAba(novaAba: Aba) {
    setAba(novaAba);
    if (novaAba === "digitar") setFonte("manual");
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Lançar compra</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
          {(
            [
              { id: "digitar", label: "⌨️ Digitar" },
              { id: "foto", label: "📷 Foto/Print" },
              { id: "voz", label: "🎙️ Voz" },
            ] as { id: Aba; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => trocarAba(t.id)}
              className={`flex-1 rounded-md py-1.5 font-medium transition ${
                aba === t.id ? "bg-white shadow text-brand-600" : "text-slate-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {aba === "foto" && (
          <div className="mb-4 space-y-2">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFotoChange}
              className="w-full text-sm"
            />
            {fotoPreview && (
              <img src={fotoPreview} alt="Prévia" className="h-32 w-full rounded-lg object-cover" />
            )}
          </div>
        )}

        {aba === "voz" && (
          <div className="mb-4 space-y-2">
            <button
              type="button"
              onClick={gravando ? pararGravacao : iniciarGravacao}
              className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white ${
                gravando ? "bg-rose-600 hover:bg-rose-700" : "bg-brand-600 hover:bg-brand-700"
              }`}
            >
              {gravando ? "⏹ Parar gravação" : "🎙️ Gravar compra por voz"}
            </button>
            <p className="text-xs text-slate-400">
              Ex: "compra no mercado por 87 reais". Fale a descrição e o valor.
            </p>
          </div>
        )}

        {extraindo && (
          <p className="mb-3 text-sm text-brand-600">Analisando {aba === "foto" ? "imagem" : "áudio"}...</p>
        )}
        {textoReconhecido && (
          <p className="mb-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">{textoReconhecido}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Descrição *</label>
            <input
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Supermercado"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Valor total (R$) *</label>
              <input
                required
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="99,90"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Categoria</label>
              <input
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Mercado, lazer..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Data da compra *</label>
              <input
                required
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Parcelas</label>
              <input
                type="number"
                min={1}
                max={48}
                value={parcelas}
                onChange={(e) => setParcelas(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {erro && <p className="text-sm text-rose-600">{erro}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {enviando ? "Salvando..." : "Salvar compra"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
