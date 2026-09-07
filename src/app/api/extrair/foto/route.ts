import { NextRequest, NextResponse } from "next/server";
import { extrairDeImagem } from "@/lib/extract";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { imagemBase64 } = body;
  if (!imagemBase64) {
    return NextResponse.json({ erro: "Imagem é obrigatória." }, { status: 400 });
  }
  const resultado = await extrairDeImagem(imagemBase64);
  return NextResponse.json(resultado);
}
