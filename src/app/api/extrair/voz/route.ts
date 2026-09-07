import { NextRequest, NextResponse } from "next/server";
import { extrairDeAudio } from "@/lib/extract";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { audioBase64 } = body;
  if (!audioBase64) {
    return NextResponse.json({ erro: "Áudio é obrigatório." }, { status: 400 });
  }
  const resultado = await extrairDeAudio(audioBase64);
  return NextResponse.json(resultado);
}
