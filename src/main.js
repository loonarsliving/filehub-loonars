import "./style.css";
import { isSTTSupported, startListening, speak, stopSpeaking } from "./voice.js";
import { getResponse } from "./brain.js";
import { playBootSequence } from "./sfx.js";

const core = document.getElementById("core");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");
const clockEl = document.getElementById("clock");
const canvas = document.getElementById("wave");
const ctx = canvas.getContext("2d");

let state = "idle"; // idle | listening | processing | speaking
let booted = false;
let stopListeningFn = null;
let audioCtx = null;
let analyser = null;
let micSource = null;
let micStream = null;
let rafId = null;

setState("idle", "SISTEM SIAGA — SENTUH UNTUK MENGAKTIFKAN");
tickClock();
setInterval(tickClock, 1000);
drawIdleWave();

core.addEventListener("click", () => {
  if (state !== "idle") {
    if (state === "listening") endListening();
    return;
  }
  if (!booted) {
    booted = true;
    unlockAudioPlayback();
    const bootMs = playBootSequence();
    setState("processing", "MENGAKTIFKAN...");
    log("sys", "Ultron diaktifkan.");
    setTimeout(beginListening, bootMs);
    return;
  }
  beginListening();
});
core.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") core.click();
});

// Buka izin autoplay audio HTML di browser ketat (Safari/iOS) lewat gesture klik pertama.
function unlockAudioPlayback() {
  const silence =
    "data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID/+xDECgPCwAAAAAAAAAAAAAAAAAAAAAAAA=";
  const a = new Audio(silence);
  a.play().catch(() => {});
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

async function beginListening() {
  if (!isSTTSupported()) {
    log("sys", "Browser ini tidak mendukung speech recognition. Coba pakai Chrome.");
    return;
  }
  try {
    await startMicAnalyser();
  } catch (err) {
    log("sys", "Tidak bisa mengakses mikrofon: " + err.message);
    return;
  }

  setState("listening", "MENDENGARKAN...");
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
        // recognizer stopped without a final result
        if (lastInterim) handleFinalTranscript(lastInterim);
        else {
          stopMicAnalyser();
          setState("idle", "SISTEM SIAGA — SENTUH UNTUK MENGAKTIFKAN");
        }
      }
    },
    onError: (e) => {
      stopMicAnalyser();
      log("sys", "Error pengenalan suara: " + (e.error || e.message || "tidak diketahui"));
      setState("idle", "SISTEM SIAGA — SENTUH UNTUK MENGAKTIFKAN");
    },
  });
}

function endListening() {
  stopListeningFn?.();
}

function handleFinalTranscript(text) {
  stopMicAnalyser();
  if (!text) {
    setState("idle", "SISTEM SIAGA — SENTUH UNTUK MENGAKTIFKAN");
    return;
  }
  log("user", text);
  setState("processing", "MEMPROSES...");

  const reply = getResponse(text);
  respond(reply);
}

function respond(reply) {
  setState("speaking", "MERESPONS...");
  log("ultron", reply);
  drawSpeakingWave();
  speak(reply, {
    lang: "id-ID",
    onEnd: () => {
      stopWaveAnim();
      setState("idle", "SISTEM SIAGA — SENTUH UNTUK MENGAKTIFKAN");
      drawIdleWave();
    },
    onError: (e) => {
      stopWaveAnim();
      const msg = e?.message || e?.target?.error?.message || e?.error?.message || String(e);
      log("sys", "Gagal memutar suara: " + msg);
      console.error("TTS error:", e);
      setState("idle", "SISTEM SIAGA — SENTUH UNTUK MENGAKTIFKAN");
      drawIdleWave();
    },
  });
}

// --- mic level visualization while listening ---

async function startMicAnalyser() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  micSource = audioCtx.createMediaStreamSource(micStream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  micSource.connect(analyser);
  drawListeningWave();
}

function stopMicAnalyser() {
  stopWaveAnim();
  micStream?.getTracks().forEach((t) => t.stop());
  audioCtx?.close().catch(() => {});
  audioCtx = null;
  analyser = null;
  micSource = null;
  micStream = null;
}

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
