# Meus Cartões — Gerenciador de Cartões de Crédito

Aplicativo web (protótipo local) para cadastrar cartões de crédito e lançar
compras por texto, foto/print ou voz, acompanhando limite, fatura e o
melhor dia para comprar.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** para a interface
- **SQLite** embutido no Node.js (`node:sqlite`) — nenhum serviço externo
  para instalar; o banco fica em `data/cartoes.db`

## Como rodar

```bash
npm install
npm run dev
```

Acesse **http://localhost:3000**.

Para rodar em modo produção local:

```bash
npm run build
npm run start
```

## Funcionalidades

- **Cadastro de cartões**: nome, bandeira, final, limite, dia de fechamento
  e dia de vencimento. Sem limite de quantidade (testado com 50+ cartões).
- **Lançamento de compras** em 3 formatos, na mesma tela:
  - ⌨️ **Digitar**: formulário manual (descrição, valor, categoria, data,
    parcelas).
  - 📷 **Foto/Print**: envia uma imagem (ou tira foto pelo celular) e
    preenche os campos automaticamente para você conferir.
  - 🎙️ **Voz**: grava um áudio pelo microfone do navegador e preenche os
    campos automaticamente para você conferir.
- **Parcelamento real**: cada compra parcelada é distribuída nas faturas
  seguintes de acordo com o fechamento do cartão, e o valor total fica
  bloqueado do limite até a última parcela vencer (como funciona de
  verdade no cartão de crédito).
- **Painel por cartão**: limite total, limite disponível, valor da fatura
  a pagar (com data de vencimento), fatura em formação no ciclo atual, e
  o **melhor dia do mês para comprar** (o dia seguinte ao fechamento,
  que dá o maior prazo até o pagamento).
- **Painel geral**: soma de limites, total disponível, total de faturas a
  pagar e destaque dos cartões que precisam de atenção (fatura vencendo
  ou limite quase estourando).

## Sobre a extração por foto e voz

Como combinado, essa primeira versão **simula** a leitura da imagem e a
transcrição do áudio (a interface e o fluxo completo já funcionam: upload
de foto, gravação real de áudio pelo microfone, edição dos dados sugeridos
antes de salvar). Toda a lógica de extração está isolada em um único
arquivo, pronta para ligar uma API de verdade sem mexer em mais nada:

- `src/lib/extract.ts` → troque `extrairDeImagem` e `extrairDeAudio` por
  chamadas reais, por exemplo:
  - **Foto/print**: um modelo de visão (GPT-4o, Claude com imagem, Google
    Vision) recebendo a imagem em base64 e devolvendo
    `{ descricao, valor, data }`.
  - **Voz**: um serviço de transcrição (OpenAI Whisper, Google
    Speech-to-Text) para transformar o áudio em texto, e depois reaproveitar
    `interpretarTexto()` (já existe nesse arquivo) para extrair o valor.

Nenhuma chave de API é necessária para usar o app como está.

## Estrutura do projeto

```
src/
  app/
    page.tsx                 → painel geral
    cartoes/page.tsx         → lista de cartões (busca + cadastro)
    cartoes/[id]/page.tsx    → detalhe do cartão, fatura e compras
    api/cartoes/...          → CRUD de cartões
    api/compras/...          → CRUD de compras
    api/extrair/foto|voz     → extração (simulada) de foto e áudio
  components/                → modais e telas (client components)
  lib/
    db.ts                    → conexão SQLite + criação das tabelas
    billing.ts                → cálculo de ciclo de fatura, vencimento,
                                 parcelas, limite disponível e melhor dia
    extract.ts                → extração de dados de foto/voz (simulada)
    data.ts                    → consultas compartilhadas (cartão + fatura)
```

## Ideias para evoluir o projeto

- **Notificações**: avisar X dias antes do vencimento (e-mail, WhatsApp ou
  push) e quando o limite passar de um certo percentual.
- **Categorias e gráficos**: gastos por categoria/mês para entender para
  onde o dinheiro está indo.
- **Detecção de assinaturas recorrentes** (streaming, academia etc.) para
  identificar gastos fixos automaticamente.
- **Importação de fatura**: ler um PDF/CSV/OFX do banco e lançar as
  compras em lote, em vez de uma por uma.
- **Comparador de "melhor cartão para essa compra"**: dado o valor e a
  data, sugerir qual cartão cadastrado dá mais prazo ou tem mais limite
  livre.
- **Múltiplos usuários/família**: compartilhar cartões entre pessoas da
  casa, com login.
- **Modo PWA**: permitir "instalar" o app no celular, com acesso mais
  direto à câmera e ao microfone.
- **Exportar dados**: baixar um CSV/Excel de todas as compras para
  declaração de imposto de renda ou controle financeiro pessoal.
- **Simulador de parcelamento**: antes de comprar, ver o impacto de
  parcelar em 3x, 6x ou 12x no limite disponível dos próximos meses.
