/**
 * ElevenLabs TTS Helper (Optional)
 * Generates speech from text using ElevenLabs API
 */

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Default: Rachel

let client: ElevenLabsClient | null = null;

function getClient(): ElevenLabsClient | null {
  if (!ELEVENLABS_API_KEY) {
    return null;
  }
  if (!client) {
    client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });
  }
  return client;
}

/**
 * Generate speech from text
 * Returns an ArrayBuffer for audio playback, or null if TTS is unavailable
 */
export async function generateSpeech(text: string): Promise<ArrayBuffer | null> {
  const elevenLabs = getClient();
  if (!elevenLabs) {
    console.log("ElevenLabs not configured - skipping TTS");
    return null;
  }

  try {
    const audioStream = await elevenLabs.textToSpeech.convert(ELEVENLABS_VOICE_ID, {
      text,
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128",
    });

    // Convert ReadableStream to ArrayBuffer
    const reader = audioStream.getReader();
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result.buffer;
  } catch (error) {
    console.error("TTS generation failed:", error);
    return null;
  }
}

/**
 * Check if TTS is available
 */
export function isTTSAvailable(): boolean {
  return !!ELEVENLABS_API_KEY;
}

