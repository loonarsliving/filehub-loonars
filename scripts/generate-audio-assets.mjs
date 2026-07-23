#!/usr/bin/env node
// Generate audio branding cues lewat ElevenLabs Sound Effects API, dengan
// fallback ke Freesound kalau ElevenLabs gagal. File yang sudah ada di
// /audio TIDAK ditimpa -- hapus manual dulu kalau mau regenerate ulang.
//
// Jalankan sekali (butuh mesin dengan akses internet normal, bukan di
// sandbox terbatas):
//
//   ELEVENLABS_API_KEY=xxx node scripts/generate-audio-assets.mjs
//
// FREESOUND_API_KEY opsional, hanya dipakai kalau ElevenLabs gagal:
//
//   ELEVENLABS_API_KEY=xxx FREESOUND_API_KEY=yyy node scripts/generate-audio-assets.mjs
//
// Setelah selesai, commit folder /audio supaya permanen -- tidak perlu
// generate ulang lagi setelahnya.

import { writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = path.join(__dirname, "..", "audio");

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const FREESOUND_API_KEY = process.env.FREESOUND_API_KEY;

const CUES = [
  {
    name: "online",
    file: "online.mp3",
    prompt:
      "Futuristic AI system startup, premium digital chime, clean holographic activation, cinematic",
    durationSeconds: 1,
    freesoundQuery: "AI Startup",
  },
  {
    name: "listening",
    file: "listening.mp3",
    prompt: "Soft futuristic listening beep, elegant sci-fi interface",
    durationSeconds: 0.5,
    freesoundQuery: "Sci-fi Interface",
  },
  {
    name: "thinking",
    file: "thinking.mp3",
    prompt: "Subtle neural processing sound, futuristic AI computing ambience",
    durationSeconds: 0.8,
    freesoundQuery: "Neural Processing",
  },
  {
    name: "success",
    file: "success.mp3",
    prompt: "Elegant confirmation chime, premium technology notification",
    durationSeconds: 0.5,
    freesoundQuery: "Digital Chime",
  },
  {
    name: "notification",
    file: "notification.mp3",
    prompt: "Modern holographic notification, soft digital ping, premium interface",
    durationSeconds: 1,
    freesoundQuery: "Computer Notification",
  },
  {
    name: "error",
    file: "error.mp3",
    prompt: "Minimal futuristic warning tone, clean technology alert",
    durationSeconds: 1,
    freesoundQuery: "Technology Notification",
  },
  {
    name: "shutdown",
    file: "shutdown.mp3",
    prompt: "Smooth AI shutdown sequence, futuristic digital fade",
    durationSeconds: 1.5,
    freesoundQuery: "Future UI",
  },
];

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function generateWithElevenLabs(cue) {
  if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY tidak disetel.");
  const duration = Math.min(22, Math.max(0.5, cue.durationSeconds));

  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: cue.prompt,
      duration_seconds: duration,
      prompt_influence: 0.3,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs sound-generation gagal (${res.status}): ${detail}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function generateWithFreesound(cue) {
  if (!FREESOUND_API_KEY) throw new Error("FREESOUND_API_KEY tidak disetel.");

  const searchUrl =
    `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(cue.freesoundQuery)}` +
    `&filter=duration:[0.1 TO 8]&sort=rating_desc&fields=id,name,previews&page_size=1&token=${FREESOUND_API_KEY}`;

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) throw new Error(`Freesound search gagal (${searchRes.status})`);

  const data = await searchRes.json();
  const result = data.results?.[0];
  if (!result) throw new Error(`Tidak ada hasil Freesound untuk "${cue.freesoundQuery}"`);

  const previewUrl = result.previews?.["preview-hq-mp3"] || result.previews?.["preview-lq-mp3"];
  if (!previewUrl) throw new Error("Hasil Freesound tidak punya preview mp3.");

  const audioRes = await fetch(previewUrl);
  if (!audioRes.ok) throw new Error(`Gagal unduh preview Freesound (${audioRes.status})`);
  return Buffer.from(await audioRes.arrayBuffer());
}

async function run() {
  await mkdir(AUDIO_DIR, { recursive: true });
  console.log(`Folder audio: ${AUDIO_DIR}\n`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const cue of CUES) {
    const dest = path.join(AUDIO_DIR, cue.file);

    if (await fileExists(dest)) {
      console.log(`✓ ${cue.file} sudah ada, lewati.`);
      skipped++;
      continue;
    }

    console.log(`→ Generate ${cue.file} ...`);
    let buffer;
    try {
      buffer = await generateWithElevenLabs(cue);
      console.log("  ElevenLabs OK.");
    } catch (err) {
      console.warn(`  ElevenLabs gagal: ${err.message}`);
      console.log(`  Coba fallback Freesound ("${cue.freesoundQuery}") ...`);
      try {
        buffer = await generateWithFreesound(cue);
        console.log("  Freesound OK.");
      } catch (fsErr) {
        console.error(`  Freesound juga gagal: ${fsErr.message}`);
        console.error(`  Lewati ${cue.file} -- isi manual nanti.\n`);
        failed++;
        continue;
      }
    }

    await writeFile(dest, buffer);
    console.log(`  Tersimpan: ${dest}\n`);
    generated++;
  }

  console.log(
    `Selesai. ${generated} dibuat, ${skipped} sudah ada, ${failed} gagal.\n` +
      (generated > 0 ? "Commit folder /audio supaya permanen." : "")
  );
}

run().catch((err) => {
  console.error("Gagal menjalankan generator:", err);
  process.exit(1);
});
