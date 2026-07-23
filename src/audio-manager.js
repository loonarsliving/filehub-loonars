// Audio Experience Engine -- pemutar cue branding (online/listening/thinking/
// dst). Reusable: tambah cue baru cukup lewat registerCue(), tidak perlu
// ubah kode di sini atau di main.js.

import { getAudioContext } from "./audio-context.js";

const CUES = {
  online: "/audio/online.mp3",
  listening: "/audio/listening.mp3",
  thinking: "/audio/thinking.mp3",
  success: "/audio/success.mp3",
  notification: "/audio/notification.mp3",
  error: "/audio/error.mp3",
  shutdown: "/audio/shutdown.mp3",
};

const bufferCache = new Map(); // nama cue -> AudioBuffer (di-decode sekali)
const activeSources = new Map(); // nama cue -> source yang sedang jalan

/** Daftarkan cue baru: AudioManager.registerCue("clickTick", "/audio/tick.mp3") */
function registerCue(name, path) {
  CUES[name] = path;
}

async function loadBuffer(name) {
  if (bufferCache.has(name)) return bufferCache.get(name);
  const path = CUES[name];
  if (!path) throw new Error(`Cue "${name}" belum terdaftar di AudioManager.`);

  const ac = getAudioContext();
  const res = await fetch(path);
  if (!res.ok) throw new Error(`File cue "${name}" tidak ditemukan di ${path}.`);
  const arrayBuffer = await res.arrayBuffer();
  const audioBuffer = await ac.decodeAudioData(arrayBuffer);
  bufferCache.set(name, audioBuffer);
  return audioBuffer;
}

/**
 * Putar sebuah cue. Mengembalikan Promise yang resolve saat cue selesai
 * diputar (atau langsung resolve kalau file belum ada / gagal dimuat --
 * kegagalan cue tidak boleh menghentikan alur aplikasi, cukup di-warn).
 */
function play(name, { volume = 1 } = {}) {
  return loadBuffer(name)
    .then((buffer) => {
      const ac = getAudioContext();

      activeSources.get(name)?.stop?.();

      const source = ac.createBufferSource();
      source.buffer = buffer;
      const gain = ac.createGain();
      gain.gain.value = volume;
      source.connect(gain).connect(ac.destination);
      activeSources.set(name, source);

      return new Promise((resolve) => {
        source.onended = () => {
          if (activeSources.get(name) === source) activeSources.delete(name);
          resolve();
        };
        source.start();
      });
    })
    .catch((err) => {
      console.warn(`[AudioManager] Cue "${name}" gagal diputar:`, err.message);
    });
}

export const AudioManager = {
  registerCue,
  play,
  playOnline: () => play("online"),
  playListening: () => play("listening"),
  playThinking: () => play("thinking"),
  playSuccess: () => play("success"),
  playNotification: () => play("notification"),
  playError: () => play("error"),
  playShutdown: () => play("shutdown"),
};
