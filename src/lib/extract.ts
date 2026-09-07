/**
 * Camada de extração de dados de compras a partir de foto/print ou áudio.
 *
 * Hoje isso é SIMULADO (não chama nenhuma API externa). Para ligar de verdade:
 *  - Foto/print: troque o corpo de `extrairDeImagem` por uma chamada a um modelo de
 *    visão (ex.: OpenAI GPT-4o / Claude com imagem) enviando `imagemBase64` e pedindo
 *    para retornar JSON com { descricao, valor, data }.
 *  - Voz: troque o corpo de `extrairDeAudio` por uma chamada a um serviço de
 *    transcrição (ex.: OpenAI Whisper) e depois faça o parse do texto retornado.
 *
 * Nenhum outro arquivo do app precisa mudar: as rotas /api/extrair/* já chamam
 * essas funções e a UI já sabe exibir os campos sugeridos para o usuário confirmar.
 */

export interface ExtracaoResultado {
  descricaoSugerida: string;
  valorSugerido: number | null;
  dataSugerida: string | null; // yyyy-MM-dd
  categoriaSugerida: string | null;
  textoReconhecido: string;
  simulado: boolean;
}

const ESTABELECIMENTOS_EXEMPLO = [
  { nome: "Supermercado Extra", categoria: "Mercado" },
  { nome: "Posto Ipiranga", categoria: "Combustível" },
  { nome: "iFood", categoria: "Alimentação" },
  { nome: "Amazon", categoria: "Compras online" },
  { nome: "Farmácia São João", categoria: "Saúde" },
];

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function extrairDeImagem(
  _imagemBase64: string
): Promise<ExtracaoResultado> {
  const exemplo =
    ESTABELECIMENTOS_EXEMPLO[
      Math.floor(Math.random() * ESTABELECIMENTOS_EXEMPLO.length)
    ];
  const valor = Math.round((Math.random() * 300 + 20) * 100) / 100;

  return {
    descricaoSugerida: exemplo.nome,
    valorSugerido: valor,
    dataSugerida: hojeISO(),
    categoriaSugerida: exemplo.categoria,
    textoReconhecido:
      "[simulado] Nenhuma leitura real foi feita da imagem. Conecte uma API de visão em src/lib/extract.ts para extrair os dados de verdade.",
    simulado: true,
  };
}

/** Faz um parse simples de um texto (transcrito ou digitado) tentando achar valor em R$. */
export function interpretarTexto(texto: string): {
  descricao: string;
  valor: number | null;
} {
  const normalizado = texto.trim();
  const match = normalizado.match(/(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i);
  let valor: number | null = null;
  if (match) {
    valor = parseFloat(match[1].replace(",", "."));
  }
  let descricao = normalizado
    .replace(/(?:r\$\s*)?\d+(?:[.,]\d{1,2})?/i, "")
    .replace(/\bem\b|\breais?\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!descricao) descricao = normalizado;
  return { descricao, valor };
}

export async function extrairDeAudio(
  _audioBase64: string
): Promise<ExtracaoResultado> {
  const frasesExemplo = [
    "compra no mercado por 87 reais e 50 centavos",
    "posto de gasolina 150 reais",
    "farmácia 43,90",
    "restaurante 62 reais",
  ];
  const frase = frasesExemplo[Math.floor(Math.random() * frasesExemplo.length)];
  const { descricao, valor } = interpretarTexto(frase);

  return {
    descricaoSugerida: descricao || "Compra por voz",
    valorSugerido: valor,
    dataSugerida: hojeISO(),
    categoriaSugerida: null,
    textoReconhecido: `[simulado] "${frase}" — nenhum áudio real foi transcrito. Conecte uma API de fala-para-texto (ex.: Whisper) em src/lib/extract.ts.`,
    simulado: true,
  };
}
