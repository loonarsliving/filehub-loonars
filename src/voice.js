// Abstraksi speech-to-text & text-to-speech.
// Provider default: Web Speech API bawaan browser (gratis, tanpa API key).
// Untuk pindah ke ElevenLabs, isi provider "elevenlabs" di bawah lalu ganti
// ACTIVE_PROVIDER — kontrak (startListening/speak) tetap sama untuk pemanggil.

const ACTIVE_PROVIDER = "webspeech";

const providers = {
  webspeech: {
    supportsSTT() {
      return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    },
    createRecognizer({ lang = "id-ID" } = {}) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) throw new Error("SpeechRecognition tidak didukung di browser ini.");
      const recognizer = new SR();
      recognizer.lang = lang;
      recognizer.continuous = false;
      recognizer.interimResults = true;
      return recognizer;
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

  // TODO: isi VITE_ELEVENLABS_API_KEY di .env lalu lengkapi dua fungsi ini
  // (STT ElevenLabs via /v1/speech-to-text, TTS via /v1/text-to-speech/{voice_id})
  // sebelum mengaktifkan provider ini.
  elevenlabs: {
    supportsSTT() {
      return false;
    },
    createRecognizer() {
      throw new Error("Provider ElevenLabs belum dikonfigurasi.");
    },
    speak() {
      throw new Error("Provider ElevenLabs belum dikonfigurasi.");
    },
    stopSpeaking() {},
  },
};

const provider = providers[ACTIVE_PROVIDER];

export function isSTTSupported() {
  return provider.supportsSTT();
}

/**
 * Mulai mendengarkan mic. Mengembalikan fungsi stop().
 */
export function startListening({ onInterim, onFinal, onEnd, onError, lang } = {}) {
  const recognizer = provider.createRecognizer({ lang });

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
}

export function speak(text, opts) {
  return provider.speak(text, opts);
}

export function stopSpeaking() {
  provider.stopSpeaking();
}
