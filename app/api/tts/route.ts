import { generateSpeech, isTTSAvailable } from "@/lib/tts";

export async function POST(req: Request) {
  if (!isTTSAvailable()) {
    return Response.json({ error: "TTS not configured" }, { status: 503 });
  }

  const { text }: { text: string } = await req.json();

  if (!text || text.length === 0) {
    return Response.json({ error: "No text provided" }, { status: 400 });
  }

  // Limit text length for TTS (reasonable summary)
  const truncatedText = text.slice(0, 500);

  const audioBuffer = await generateSpeech(truncatedText);

  if (!audioBuffer) {
    return Response.json({ error: "TTS generation failed" }, { status: 500 });
  }

  return new Response(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.byteLength.toString(),
    },
  });
}

