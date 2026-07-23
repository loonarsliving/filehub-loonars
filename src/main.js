import "./style.css";
import { isSTTSupported, startListening, speak, stopSpeaking } from "./voice.js";
import { getResponse } from "./brain.js";
import { getAudioContext } from "./audio-context.js";
import { AudioManager } from "./audio-manager.js";
import { USER_NAME, HONORIFIC } from "./config.js";

const ONLINE_LINE = `Ultron online. Seluruh modul aktif. Siap menerima perintah, ${HONORIFIC}.`;
const FIRST_LISTEN_LINES = [`Ya, ${HONORIFIC}?`, `Saya mendengarkan, ${USER_NAME}.`];

const core = document.getElementById("core");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");
const clockEl = document.getElementById("clock");
const canvas = document.getElementById("wave");
const ctx = canvas.getContext("2d");

// Ambang batas deteksi suara (voice activity). RMS 0..1 dari sinyal mic.
// Mungkin perlu disetel ulang tergantung sensitivitas mic/lingkungan.
const SPEECH_THRESHOLD = 0.035;
const SILENCE_MS = 1100; // diam sekian ms setelah bicara -> anggap selesai
const MIN_SPEECH_MS = 250; // minimal durasi bicara sebelum silence-timeout dihitung

// Barge-in (interupsi saat Ultron bicara) dibuat jauh lebih ketat dari VAD
// biasa, supaya mic yang menangkap balik suara Ultron sendiri dari speaker
// (echo/feedback) tidak salah dikira user bicara.
const BARGE_IN_THRESHOLD = 0.11; // ambang jauh lebih tinggi dari SPEECH_THRESHOLD
const BARGE_IN_SUSTAIN_MS = 400; // harus keras terus-menerus sekian ms, bukan sekali lonjakan
const BARGE_IN_GRACE_MS = 400; // abaikan sesaat di awal bicara (pop/klik audio paling keras di situ)

let state = "idle"; // idle | listening | processing | speaking
let active = false; // mode hands-free sedang menyala?
let booted = false;
let stopListeningFn = null;
let analyser = null;
let micSource = null;
let micStream = null;
let rafId = null; // animasi waveform
let monitorId = null; // loop VAD/barge-in
let speechStartedAt = null;
let lastSpeechAt = null;
let speakingStartedAt = null;
let bargeInStartedAt = null;

setState("idle", "SISTEM SIAGA — SENTUH UNTUK MENGAKTIFKAN");
tickClock();
setInterval(tickClock, 1000);
drawIdleWave();

core.addEventListener("click", () => {
  if (active) {
    deactivate();
  } else {
    activate();
  }
});
core.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") core.click();
});

function unlockAudioPlayback() {
  getAudioContext();
}

function tickClock() {
  clockEl.textContent = new Date().toLocaleTimeString("id-ID", { hour12: false });
}

function setState(next, statusText) {
  state = next;
  core.classList.remove("listening", "processing", "speaking");
  if (next !== "idle") core.classList.add(next);
  if (statusText) statusEl.textContent = statusText;
}

function log(role, text) {
  const line = document.createElement("div");
  line.className = `log-line ${role}`;
  const tagMap = { user: "ANDA", ultron: "ULTRON", sys: "SISTEM" };
  line.innerHTML = `<span class="tag">${tagMap[role] || role}</span>${escapeHtml(text)}`;
  logEl.prepend(line);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// --- power on/off ---

function activate() {
  active = true;
  unlockAudioPlayback();
  setState("processing", "MENGAKTIFKAN...");
  log("sys", "Ultron diaktifkan.");
  if (!booted) {
    booted = true;
    runBootSequence();
  } else {
    startHandsFree({ announce: false });
  }
}

async function runBootSequence() {
  setState("speaking", "MENGAKTIFKAN...");
  await AudioManager.playOnline();
  await speakBranding(ONLINE_LINE);
  await startHandsFree({ announce: true });
}

async function startHandsFree({ announce }) {
  if (!isSTTSupported()) {
    log("sys", "Browser ini tidak mendukung mode ini. Coba pakai Chrome.");
    active = false;
    setState("idle", "SISTEM SIAGA — SENTUH UNTUK MENGAKTIFKAN");
    return;
  }
  try {
    await acquireMic();
  } catch (err) {
    log("sys", "Tidak bisa mengakses mikrofon: " + err.message);
    AudioManager.playError();
    active = false;
    setState("idle", "SISTEM SIAGA — SENTUH UNTUK MENGAKTIFKAN");
    return;
  }

  if (announce) {
    await AudioManager.playListening();
    const line = FIRST_LISTEN_LINES[Math.floor(Math.random() * FIRST_LISTEN_LINES.length)];
    await speakBranding(line);
  }

  startMonitorLoop();
  beginRecordingSession();
}

/** Ucapkan satu baris branding (boot/first-listen), lalu resolve saat selesai. */
function speakBranding(text) {
  return new Promise((resolve) => {
    log("ultron", text);
    drawSpeakingWave();
    speak(text, {
      lang: "id-ID",
      onEnd: () => {
        stopWaveAnim();
        resolve();
      },
      onError: (e) => {
        stopWaveAnim();
        console.error("TTS error (branding):", e);
        resolve();
      },
    });
  });
}

function deactivate() {
  active = false;
  stopListeningFn?.();
  stopListeningFn = null;
  stopSpeaking();
  stopMonitorLoop();
  stopWaveAnim();
  setState("processing", "MENONAKTIFKAN...");
  AudioManager.playShutdown().then(() => {
    releaseMic();
    setState("idle", "SISTEM SIAGA — SENTUH UNTUK MENGAKTIFKAN");
    drawIdleWave();
    log("sys", "Ultron nonaktif.");
  });
}

// --- mic lifecycle ---

async function acquireMic() {
  if (micStream) return;
  const ac = getAudioContext();
  micStream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  micSource = ac.createMediaStreamSource(micStream);
  analyser = ac.createAnalyser();
  analyser.fftSize = 1024;
  micSource.connect(analyser);
}

function releaseMic() {
  micStream?.getTracks().forEach((t) => t.stop());
  micSource?.disconnect();
  analyser = null;
  micSource = null;
  micStream = null;
}

// --- percakapan: satu sesi rekam per giliran bicara ---

function beginRecordingSession() {
  setState("listening", "MENDENGARKAN...");
  speechStartedAt = null;
  lastSpeechAt = null;
  drawListeningWave();

  let lastInterim = "";
  stopListeningFn = startListening({
    stream: micStream,
    lang: "id-ID",
    onInterim: (text) => {
      lastInterim = text;
      statusEl.textContent = `MENDENGARKAN: ${text}`;
    },
    onFinal: (text) => {
      handleFinalTranscript(text || lastInterim);
    },
    onEnd: () => {
      if (state === "listening") {
        if (lastInterim) handleFinalTranscript(lastInterim);
        else if (active) beginRecordingSession();
        else {
          setState("idle", "SISTEM SIAGA — SENTUH UNTUK MENGAKTIFKAN");
        }
      }
    },
    onError: (e) => {
      log("sys", "Error pengenalan suara: " + (e.error || e.message || "tidak diketahui"));
      AudioManager.playError();
      if (active) beginRecordingSession();
      else setState("idle", "SISTEM SIAGA — SENTUH UNTUK MENGAKTIFKAN");
    },
  });
}

function handleFinalTranscript(text) {
  stopWaveAnim();
  if (!text) {
    if (active) beginRecordingSession();
    else setState("idle", "SISTEM SIAGA — SENTUH UNTUK MENGAKTIFKAN");
    return;
  }
  log("user", text);
  setState("processing", "MEMPROSES...");
  AudioManager.playThinking();

  const reply = getResponse(text);
  respond(reply);
}

function respond({ text, announceOnline }) {
  setState("speaking", "MERESPONS...");
  speakingStartedAt = performance.now();
  bargeInStartedAt = null;
  log("ultron", text);
  // Cue dan ucapan boleh sedikit tumpang tindih (tidak menunggu cue selesai
  // dulu) supaya tidak menambah delay sebelum Ultron mulai bicara.
  if (announceOnline) AudioManager.playOnline();
  else AudioManager.playSuccess();
  drawSpeakingWave();
  speak(text, {
    lang: "id-ID",
    onEnd: () => {
      stopWaveAnim();
      if (active) beginRecordingSession();
      else setState("idle", "SISTEM SIAGA — SENTUH UNTUK MENGAKTIFKAN");
    },
    onError: (e) => {
      stopWaveAnim();
      const msg = e?.message || e?.target?.error?.message || e?.error?.message || String(e);
      log("sys", "Gagal memutar suara: " + msg);
      console.error("TTS error:", e);
      AudioManager.playError();
      if (active) beginRecordingSession();
      else setState("idle", "SISTEM SIAGA — SENTUH UNTUK MENGAKTIFKAN");
    },
  });
}

// --- voice activity detection: auto-stop saat diam, barge-in saat bicara ---

function startMonitorLoop() {
  const data = new Uint8Array(analyser.fftSize);

  const loop = () => {
    if (!active || !analyser) return;

    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    const now = performance.now();

    if (state === "listening") {
      const talking = rms > SPEECH_THRESHOLD;
      if (talking) {
        if (!speechStartedAt) speechStartedAt = now;
        lastSpeechAt = now;
      } else if (
        speechStartedAt &&
        now - speechStartedAt > MIN_SPEECH_MS &&
        now - lastSpeechAt > SILENCE_MS
      ) {
        speechStartedAt = null;
        stopListeningFn?.();
      }
    } else if (state === "speaking") {
      const withinGrace = speakingStartedAt && now - speakingStartedAt < BARGE_IN_GRACE_MS;
      const loud = rms > BARGE_IN_THRESHOLD;

      if (withinGrace || !loud) {
        bargeInStartedAt = null;
      } else {
        if (!bargeInStartedAt) bargeInStartedAt = now;
        if (now - bargeInStartedAt > BARGE_IN_SUSTAIN_MS) {
          log("sys", "Ultron dihentikan — mendengarkan kamu.");
          stopSpeaking();
          stopWaveAnim();
          bargeInStartedAt = null;
          beginRecordingSession();
        }
      }
    }

    monitorId = requestAnimationFrame(loop);
  };

  monitorId = requestAnimationFrame(loop);
}

function stopMonitorLoop() {
  if (monitorId) cancelAnimationFrame(monitorId);
  monitorId = null;
  speechStartedAt = null;
  lastSpeechAt = null;
}

// --- waveform visualization ---

function stopWaveAnim() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

function drawListeningWave() {
  const data = new Uint8Array(analyser.frequencyBinCount);
  const loop = () => {
    analyser.getByteFrequencyData(data);
    renderBars(data, "#ff2b2b");
    rafId = requestAnimationFrame(loop);
  };
  loop();
}

function drawSpeakingWave() {
  let t = 0;
  const bars = 48;
  const loop = () => {
    t += 0.12;
    const data = new Uint8Array(bars);
    for (let i = 0; i < bars; i++) {
      data[i] = 80 + Math.sin(t + i * 0.5) * 60 + Math.random() * 40;
    }
    renderBars(data, "#ff6b6b");
    rafId = requestAnimationFrame(loop);
  };
  loop();
}

function drawIdleWave() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function renderBars(data, color) {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = 95;
  const bars = data.length;

  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  for (let i = 0; i < bars; i++) {
    const angle = (i / bars) * Math.PI * 2;
    const amp = (data[i] / 255) * 60 + 4;
    const x1 = cx + Math.cos(angle) * radius;
    const y1 = cy + Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle) * (radius + amp);
    const y2 = cy + Math.sin(angle) * (radius + amp);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

log("sys", "Ultron online. Menunggu perintah.");
