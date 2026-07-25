// Abstraksi speech-to-text & text-to-speech.
// Provider aktif: ElevenLabs (lewat proxy /api/tts & /api/stt di server,
// supaya API key tidak pernah terekspos ke browser).
// Provider "webspeech" tetap tersedia sebagai fallback tanpa API key.

import { getAudioContext } from "./audio-context.js";
import { getCachedAudio, setCachedAudio, isCached } from "./tts-cache.js";
import { toSpeech } from "./pronunciation.js";

const ACTIVE_PROVIDER = "elevenlabs";

let currentSource = null;

const providers = {
  webspeech: {
    supportsSTT() {
      return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    },
    startListening({ onInterim, onFinal, onEnd, onError, lang = "id-ID" } = {}) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        onError?.(new Error("SpeechRecognition tidak didukung di browser ini."));
        return () => {};
      }
      const recognizer = new SR();
      recognizer.lang = lang;
      recognizer.continuous = false;
      recognizer.interimResults = true;

      recognizer.onresult = (event) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += chunk;
          else interim += chunk;
        }
        if (interim) onInterim?.(interim);
        if (final) onFinal?.(final.trim());
      };
      recognizer.onerror = (e) => onError?.(e);
      recognizer.onend = () => onEnd?.();

      recognizer.start();
      return () => recognizer.stop();
    },
    speak(text, { lang = "id-ID", onStart, onEnd, onError } = {}) {
      if (!window.speechSynthesis) {
        onError?.(new Error("speechSynthesis tidak didukung di browser ini."));
        return;
      }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = 1.02;
      utter.pitch = 0.75;
      utter.onstart = () => onStart?.();
      utter.onend = () => onEnd?.();
      utter.onerror = (e) => onError?.(e);
      window.speechSynthesis.speak(utter);
    },
    stopSpeaking() {
      window.speechSynthesis?.cancel();
    },
  },

  elevenlabs: {
    supportsSTT() {
      return !!(navigator.mediaDevices && window.MediaRecorder);
    },
    startListening({ stream, onFinal, onEnd, onError } = {}) {
      if (!stream) {
        onError?.(new Error("Mic stream tidak tersedia untuk perekaman."));
        return () => {};
      }
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: mimeType });
          const form = new FormData();
          form.append("file", blob, "speech.webm");
          form.append("model_id", "scribe_v1");
          form.append("language_code", "id");

          const res = await fetch("/api/stt", { method: "POST", body: form });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data.error || `STT gagal (${res.status})`);
          }
          onFinal?.((data.text || "").trim());
        } catch (err) {
          onError?.(err);
        } finally {
          onEnd?.();
        }
      };

      recorder.start();
      return () => {
        if (recorder.state !== "inactive") recorder.stop();
      };
    },
    speak(text, { onStart, onEnd, onError } = {}) {
      (async () => {
        try {
          const ac = getAudioContext();

          // Cache dulu: kalimat yang persis sama (branding, sapaan, jawaban
          // pengetahuan lokal, hasil skill) cukup di-generate sekali seumur
          // hidup perangkat -- setelah itu nol panggilan ElevenLabs.
          const audioBuffer = (await getCachedAudio(ac, text)) || (await fetchAndCache(ac, text));

          currentSource?.stop?.();
          const source = ac.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ac.destination);
          source.onended = () => onEnd?.();
          currentSource = source;
          onStart?.();
          source.start();
        } catch (err) {
          // ElevenLabs gagal (offline, kuota habis, error server) -- jangan
          // bisu. Pakai suara bawaan perangkat supaya FRIDAY tetap menjawab.
          console.warn("[voice] ElevenLabs gagal, pakai suara bawaan:", err?.message);
          if (speakWithDeviceVoice(text, { onStart, onEnd })) return;
          onError?.(err);
        }
      })();
    },
    stopSpeaking() {
      currentSource?.stop?.();
      currentSource = null;
      window.speechSynthesis?.cancel();
    },
  },
};

/** Ambil dari ElevenLabs lalu simpan ke cache. Mengembalikan AudioBuffer. */
async function fetchAndCache(ac, text) {
  const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `TTS gagal (${res.status})`);
  }
  const arrayBuffer = await res.arrayBuffer();
  // decodeAudioData bisa mengosongkan buffer masukannya di sebagian browser
  // (Safari) -- klon dulu supaya salinan untuk cache tetap utuh.
  const forCache = arrayBuffer.slice(0);
  const audioBuffer = await ac.decodeAudioData(arrayBuffer);
  setCachedAudio(text, forCache, audioBuffer);
  return audioBuffer;
}

/** Suara bawaan perangkat (gratis, offline). Prioritaskan suara perempuan Indonesia. */
function speakWithDeviceVoice(text, { onStart, onEnd } = {}) {
  if (!window.speechSynthesis) return false;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "id-ID";
    utter.rate = 1.02;
    utter.pitch = 1.15; // sedikit lebih tinggi -- karakter suara perempuan
    const voices = window.speechSynthesis.getVoices() || [];
    const idVoice =
      voices.find((v) => v.lang?.startsWith("id") && /female|wanita|perempuan/i.test(v.name)) ||
      voices.find((v) => v.lang?.startsWith("id"));
    if (idVoice) utter.voice = idVoice;
    utter.onstart = () => onStart?.();
    utter.onend = () => onEnd?.();
    utter.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}

const provider = providers[ACTIVE_PROVIDER];

export function isSTTSupported() {
  return provider.supportsSTT();
}

/**
 * Mulai mendengarkan. `stream` (MediaStream mic) dibutuhkan provider elevenlabs;
 * diabaikan oleh provider webspeech. Mengembalikan fungsi stop().
 */
export function startListening(opts) {
  return provider.startListening(opts);
}

export function speak(text, opts) {
  // Terapkan override pengucapan HANYA untuk audio -- teks yang tampil di layar
  // (diatur di main.js) tetap memakai teks asli.
  return provider.speak(toSpeech(text), opts);
}

export function stopSpeaking() {
  provider.stopSpeaking();
}

/**
 * Isi cache untuk sebuah kalimat TANPA memutarnya. Dipakai prewarm (main.js)
 * agar kalimat yang pasti/sering diucapkan di-generate sekali di latar belakang,
 * sehingga pemakaian berikutnya nol panggilan ElevenLabs. Lewati bila sudah ada.
 * @returns {Promise<boolean>} true bila baru saja di-generate.
 */
export async function prefetchSpeech(text) {
  const spoken = toSpeech(text);
  if (!spoken || (await isCached(spoken))) return false;
  try {
    await fetchAndCache(getAudioContext(), spoken);
    return true;
  } catch (err) {
    console.warn("[voice] prewarm gagal:", err?.message);
    return false;
  }
}
