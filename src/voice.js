// Abstraksi speech-to-text & text-to-speech.
// Provider aktif: ElevenLabs (lewat proxy /api/tts & /api/stt di server,
// supaya API key tidak pernah terekspos ke browser).
// Provider "webspeech" tetap tersedia sebagai fallback tanpa API key.

import { getAudioContext } from "./audio-context.js";

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
          const url = `/api/tts?text=${encodeURIComponent(text)}`;
          const res = await fetch(url);
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `TTS gagal (${res.status})`);
          }
          const arrayBuffer = await res.arrayBuffer();
          const audioBuffer = await ac.decodeAudioData(arrayBuffer);

          currentSource?.stop?.();
          const source = ac.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ac.destination);
          source.onended = () => onEnd?.();
          currentSource = source;
          onStart?.();
          source.start();
        } catch (err) {
          onError?.(err);
        }
      })();
    },
    stopSpeaking() {
      currentSource?.stop?.();
      currentSource = null;
    },
  },
};

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
  return provider.speak(text, opts);
}

export function stopSpeaking() {
  provider.stopSpeaking();
}
