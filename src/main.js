import "./style.css";
import { isSTTSupported, startListening, speak, stopSpeaking, prefetchSpeech } from "./voice.js";
import { getCacheStats, refreshCacheStats } from "./tts-cache.js";
import { getResponse, getMorningDigestIfDue, isCompanyGate } from "./brain.js";
import { isWakeWordSupported, resume as resumeWakeWord, startWakeWord, suspend as suspendWakeWord } from "./wake-word.js";
import { bootReportText, buildBootReport, FIXED_BOOT_PHRASES } from "./boot-report.js";
import { fetchGroupSnapshot } from "./holding.js";
import { getAccessToken } from "./mkhsistem.js";
import { onSkillAnnounce } from "./skills.js";
import { getAudioContext } from "./audio-context.js";
import { AudioManager } from "./audio-manager.js";
import { ASSISTANT_NAME, USER_NAME, HONORIFIC } from "./config.js";
import { isConfigured as isMkhsistemConfigured, getSession, login } from "./mkhsistem.js";

const ONLINE_LINE = `${ASSISTANT_NAME} online. Seluruh modul aktif. Siap menerima perintah, ${HONORIFIC}.`;
const FIRST_LISTEN_LINES = [`Ya, ${HONORIFIC}?`, `Saya mendengarkan, ${USER_NAME}.`];

const core = document.getElementById("core");
const statusEl = document.getElementById("status");
const statusChip = document.getElementById("statusChip");
const subtitleEl = document.getElementById("subtitle");
const logEl = document.getElementById("log");
const clockEl = document.getElementById("clock");
const canvas = document.getElementById("wave");
const ctx = canvas.getContext("2d");
const loginOverlay = document.getElementById("loginOverlay");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");

// Elemen telemetri HUD (sebagian nilai nyata: mic, latensi, uptime).
const tCore = document.getElementById("tCore");
const tMic = document.getElementById("tMic");
const tLatency = document.getElementById("tLatency");
const tUptime = document.getElementById("tUptime");
const tCache = document.getElementById("tCache");

// Label ringkas per-state untuk chip status di header.
const CHIP_LABELS = { idle: "SIAGA", listening: "MENDENGARKAN", processing: "MEMPROSES", speaking: "MERESPONS" };

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
let activatedAt = null; // untuk uptime telemetri
let lastLatencyMs = null; // waktu jawaban terakhir (skill lokal ~0ms, Gemini lebih lama)
let coreTemp = 36.6; // suhu inti (estetika HUD, random walk)
let wakeLock = null; // WakeLockSentinel -- menahan layar tetap menyala saat aktif

setState("idle", idleStatusText());
armWakeWord();
tickClock();
setInterval(tickClock, 1000);
setInterval(updateTelemetry, 500);
refreshCacheStats(); // hitung kalimat yang sudah tersimpan dari sesi sebelumnya
drawIdleWave();

// Timer/pengingat yang selesai (dari skills.js) diumumkan lewat sini.
onSkillAnnounce(announceReminder);

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

// --- wake lock: layar tidak mati selama FRIDAY aktif -----------------------
// Browser TIDAK mengizinkan halaman web mendengarkan saat layar mati/terkunci
// (mic dihentikan sistem). Yang bisa dilakukan: menahan layar tetap menyala
// selama FRIDAY aktif, supaya sesi hands-free tidak terputus sendiri.

async function acquireWakeLock() {
  try {
    if (!("wakeLock" in navigator)) return;
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener?.("release", () => {
      wakeLock = null;
    });
  } catch (err) {
    console.warn("[wakelock] tidak bisa menahan layar:", err?.message);
  }
}

function releaseWakeLock() {
  try {
    wakeLock?.release?.();
  } catch {
    /* abaikan */
  }
  wakeLock = null;
}

// Sistem melepas wake lock saat tab tersembunyi -- ambil lagi begitu kembali.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && active && !wakeLock) acquireWakeLock();
});

// --- service worker: pasang sebagai app (PWA) + jalan offline --------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("[sw] gagal mendaftar:", err?.message);
    });
  });
}

// --- prewarm cache suara ---------------------------------------------------
// Kalimat yang PASTI diucapkan (boot, sapaan pertama) dan beberapa jawaban yang
// paling sering diminta di-generate sekali di latar belakang saat perangkat
// menganggur. Setelah itu tersimpan permanen -- pemakaian berikutnya nol
// panggilan ElevenLabs. Hanya dijalankan sekali per versi daftar.

const PREWARM_VERSION_KEY = "friday-prewarm-v1";

function prewarmLines() {
  return [
    ONLINE_LINE,
    ...FIRST_LISTEN_LINES,
    `Selamat pagi, ${HONORIFIC}. Saya online dan siap melayani.`,
    `Selamat siang, ${HONORIFIC}. Saya online dan siap melayani.`,
    `Selamat sore, ${HONORIFIC}. Saya online dan siap melayani.`,
    `Selamat malam, ${HONORIFIC}. Saya online dan siap melayani.`,
    `Sama-sama, ${HONORIFIC}. Dengan senang hati.`,
    `Sistemku berjalan optimal, ${HONORIFIC}. Seluruh modul nominal dan siap membantu.`,
    `Pintu MK Connect terbuka, ${HONORIFIC}. Apa yang ingin kamu cek?`,
    `Maaf, ${HONORIFIC}, itu di luar pengetahuan lokalku. Kalau ini soal data perusahaan, awali dengan "cek perusahaan".`,
  ];
}

async function prewarmVoiceCache() {
  try {
    if (localStorage.getItem(PREWARM_VERSION_KEY)) return;
  } catch {
    return; // localStorage diblokir -- lewati prewarm
  }

  let generated = 0;
  // Kalimat tetap laporan bangun ikut dipanaskan: inilah yang membuat
  // pembangunan berikutnya diputar dari rekaman, bukan dibuat ulang.
  for (const line of [...prewarmLines(), ...FIXED_BOOT_PHRASES]) {
    if (!navigator.onLine) break;
    // Berurutan (bukan paralel) supaya tidak kena rate limit ElevenLabs.
    if (await prefetchSpeech(line)) generated++;
    await new Promise((r) => setTimeout(r, 400));
  }
  try {
    localStorage.setItem(PREWARM_VERSION_KEY, String(Date.now()));
  } catch {
    /* abaikan */
  }
  if (generated) log("sys", `${generated} kalimat suara disiapkan untuk dipakai offline.`);
  refreshCacheStats();
}

function tickClock() {
  clockEl.textContent = new Date().toLocaleTimeString("id-ID", { hour12: false });
}

function setState(next, statusText) {
  state = next;
  core.classList.remove("listening", "processing", "speaking");
  if (next !== "idle") core.classList.add(next);
  if (statusText) statusEl.textContent = statusText;

  document.body.classList.toggle("active", active);
  const label = next === "idle" && !active ? "OFFLINE" : CHIP_LABELS[next];
  statusChip.textContent = label;
  statusChip.className = `hud-tag hud-tag-center${next !== "idle" ? " chip-" + next : ""}`;
}

/** Tampilkan/hapus subtitle besar (ucapan Ultron yang sedang berlangsung). */
function setSubtitle(text) {
  subtitleEl.textContent = text || "";
  subtitleEl.classList.toggle("show", Boolean(text));
}

/** Perbarui panel telemetri. Uptime & latensi nyata; suhu inti estetika HUD. */
function updateTelemetry() {
  if (activatedAt) {
    const secs = Math.floor((Date.now() - activatedAt) / 1000);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n) => String(n).padStart(2, "0");
    tUptime.textContent = h ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  } else {
    tUptime.textContent = "00:00";
  }

  // Random walk kecil supaya angka terasa hidup, tetap di rentang wajar.
  coreTemp += (Math.random() - 0.5) * 0.2;
  coreTemp = Math.max(36.0, Math.min(37.6, coreTemp));
  tCore.textContent = `${coreTemp.toFixed(1)}°`;

  if (lastLatencyMs != null) tLatency.textContent = `${lastLatencyMs} ms`;
  if (!active) tMic.style.width = "0%";

  // Cache suara: berapa kalimat tersimpan & berapa kali dipakai ulang (tiap
  // pemakaian ulang = satu panggilan ElevenLabs yang tidak jadi terkirim).
  if (tCache) {
    const c = getCacheStats();
    tCache.textContent = `${c.entries} / ${c.hits}`;
  }
}

function log(role, text) {
  const line = document.createElement("div");
  line.className = `log-line ${role}`;
  const tagMap = { user: "ANDA", ultron: ASSISTANT_NAME, sys: "SISTEM" };
  line.innerHTML = `<span class="tag">${tagMap[role] || role}</span>${escapeHtml(text)}`;
  logEl.prepend(line);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// --- power on/off ---

/** Teks siaga menyesuaikan: percuma menjanjikan "panggil FRIDAY" di browser yang tidak mendukungnya. */
function idleStatusText() {
  return isWakeWordSupported()
    ? `SISTEM SIAGA — PANGGIL "${ASSISTANT_NAME}" ATAU SENTUH`
    : "SISTEM SIAGA — SENTUH UNTUK MENGAKTIFKAN";
}

/**
 * Kata bangun hanya hidup saat FRIDAY SIAGA.
 *
 * Saat aktif, pipeline utama yang memegang mikrofon, dan dua pendengar pada
 * satu mikrofon saling berebut. Saat FRIDAY bicara, ia menyebut namanya
 * sendiri -- tanpa dimatikan, ia akan membangunkan dirinya berulang-ulang.
 */
function armWakeWord() {
  if (!isWakeWordSupported()) return;
  startWakeWord(() => {
    if (active) return;
    log("sys", `Kata bangun terdengar.`);
    activate();
  });
}

async function activate() {
  suspendWakeWord();
  active = true;
  activatedAt = Date.now();
  unlockAudioPlayback();
  acquireWakeLock(); // tahan layar supaya sesi hands-free tidak terputus
  setState("processing", "MENGAKTIFKAN...");
  log("sys", `${ASSISTANT_NAME} diaktifkan.`);

  // Tidak lagi memaksa login MK Connect saat aktivasi -- FRIDAY jalan lokal dulu.
  // Login baru diminta saat pengguna memakai gerbang "cek perusahaan"
  // (lihat handleFinalTranscript).

  if (!booted) {
    booted = true;
    runBootSequence();
  } else {
    startHandsFree({ announce: false });
  }
}

/** Memastikan ada sesi login MK Connect aktif, menampilkan form login bila belum. Resolve false bila dibatalkan (Esc). */
async function ensureMkhsistemSession() {
  try {
    const session = await getSession();
    if (session) return true;
  } catch (err) {
    console.error("Gagal memeriksa sesi MK Connect:", err);
  }
  log("sys", "Perlu login ke MK Connect untuk mengakses data perusahaan.");
  return showLoginOverlay();
}

function showLoginOverlay() {
  return new Promise((resolve) => {
    loginOverlay.hidden = false;
    loginError.textContent = "";
    loginEmail.focus();

    function cleanup() {
      loginForm.removeEventListener("submit", onSubmit);
      document.removeEventListener("keydown", onKeydown);
      loginOverlay.hidden = true;
      loginPassword.value = "";
    }

    async function onSubmit(e) {
      e.preventDefault();
      loginError.textContent = "";
      try {
        await login(loginEmail.value.trim(), loginPassword.value);
        cleanup();
        resolve(true);
      } catch (err) {
        loginError.textContent = err.message || "Gagal masuk. Periksa email/password.";
      }
    }

    function onKeydown(e) {
      if (e.key === "Escape") {
        cleanup();
        resolve(false);
      }
    }

    loginForm.addEventListener("submit", onSubmit);
    document.addEventListener("keydown", onKeydown);
  });
}

async function runBootSequence() {
  setState("speaking", "MENGAKTIFKAN...");
  await AudioManager.playOnline();

  // Laporan bangun: potongan tetap datang dari cache (nol panggilan
  // ElevenLabs), hanya potongan berangka dan headline hari ini yang baru.
  // Snapshot diambil dengan batas waktu -- FRIDAY yang dibangunkan lalu diam
  // beberapa detik terasa rusak, bahkan kalau penyebabnya cuma jaringan lambat.
  let snapshot = null;
  try {
    const token = await getAccessToken().catch(() => null);
    snapshot = await Promise.race([
      fetchGroupSnapshot(token),
      new Promise((resolve) => setTimeout(() => resolve(null), 6000)),
    ]);
  } catch (err) {
    console.warn("[boot] snapshot grup gagal:", err?.message);
  }

  const reportLines = buildBootReport(snapshot);
  log("sys", bootReportText(reportLines));
  for (const line of reportLines) {
    await speakBranding(line);
  }

  // Laporan pagi otomatis -- sekali per hari kalender, begitu Ultron online
  // dia langsung membacakan ringkasan MK Connect terakhir (termasuk audit
  // media sosial harian) tanpa perlu diminta. Baca tabel biasa lewat
  // mkhsistem.js, bukan panggilan Gemini.
  const morningDigest = await getMorningDigestIfDue();
  if (morningDigest) {
    log("sys", "Laporan pagi otomatis.");
    await speakBranding(morningDigest);
  }

  await startHandsFree({ announce: true });

  // Siapkan cache suara saat perangkat menganggur -- sekali saja, di latar
  // belakang, supaya pemakaian berikutnya tidak memanggil ElevenLabs lagi.
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 3000));
  idle(() => prewarmVoiceCache());
}

async function startHandsFree({ announce }) {
  if (!isSTTSupported()) {
    log("sys", "Browser ini tidak mendukung mode ini. Coba pakai Chrome.");
    active = false;
    setState("idle", idleStatusText());
    return;
  }
  try {
    await acquireMic();
  } catch (err) {
    log("sys", "Tidak bisa mengakses mikrofon: " + err.message);
    AudioManager.playError();
    active = false;
    setState("idle", idleStatusText());
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
    setSubtitle(text);
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
  resumeWakeWord();
  activatedAt = null;
  releaseWakeLock();
  setSubtitle("");
  stopListeningFn?.();
  stopListeningFn = null;
  stopSpeaking();
  stopMonitorLoop();
  stopWaveAnim();
  setState("processing", "MENONAKTIFKAN...");
  AudioManager.playShutdown().then(() => {
    releaseMic();
    setState("idle", idleStatusText());
    drawIdleWave();
    log("sys", `${ASSISTANT_NAME} nonaktif.`);
  });
}

/**
 * Umumkan pengingat/timer yang selesai (dipicu skills.js). Interupsi lembut:
 * hentikan rekaman/ucapan yang sedang jalan, mainkan cue notifikasi, bacakan
 * pesannya, lalu kembali mendengarkan bila Ultron masih aktif.
 */
function announceReminder(text) {
  if (!text) return;
  stopListeningFn?.();
  stopListeningFn = null;
  stopSpeaking();
  stopWaveAnim();
  log("sys", "Pengingat berbunyi.");
  setState("speaking", "PENGINGAT...");
  AudioManager.playNotification();
  setSubtitle(text);
  log("ultron", text);
  drawSpeakingWave();
  speak(text, {
    lang: "id-ID",
    onEnd: () => {
      stopWaveAnim();
      if (active) beginRecordingSession();
      else setState("idle", idleStatusText());
    },
    onError: () => {
      stopWaveAnim();
      if (active) beginRecordingSession();
      else setState("idle", idleStatusText());
    },
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
  setSubtitle("");
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
          setState("idle", idleStatusText());
        }
      }
    },
    onError: (e) => {
      log("sys", "Error pengenalan suara: " + (e.error || e.message || "tidak diketahui"));
      AudioManager.playError();
      if (active) beginRecordingSession();
      else setState("idle", idleStatusText());
    },
  });
}

async function handleFinalTranscript(text) {
  stopWaveAnim();
  if (!text) {
    if (active) beginRecordingSession();
    else setState("idle", idleStatusText());
    return;
  }
  log("user", text);
  setState("processing", "MEMPROSES...");
  AudioManager.playThinking();

  // Gerbang "cek perusahaan" butuh sesi MK Connect. Minta login hanya di sini,
  // bukan saat aktivasi -- pemakaian lokal biasa tidak perlu login sama sekali.
  if (isMkhsistemConfigured() && isCompanyGate(text)) {
    await ensureMkhsistemSession();
    if (!active) return; // dinonaktifkan selagi form login terbuka
  }

  const t0 = performance.now();
  const reply = await getResponse(text);
  lastLatencyMs = Math.round(performance.now() - t0);
  if (!active) return; // dinonaktifkan selagi menunggu jawaban
  respond(reply);
}

function respond({ text, announceOnline }) {
  setState("speaking", "MERESPONS...");
  speakingStartedAt = performance.now();
  bargeInStartedAt = null;
  log("ultron", text);
  setSubtitle(text);
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
      else setState("idle", idleStatusText());
    },
    onError: (e) => {
      stopWaveAnim();
      const msg = e?.message || e?.target?.error?.message || e?.error?.message || String(e);
      log("sys", "Gagal memutar suara: " + msg);
      console.error("TTS error:", e);
      AudioManager.playError();
      if (active) beginRecordingSession();
      else setState("idle", idleStatusText());
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

    // Meteran mic telemetri (nyata) -- skala supaya bicara normal mengisi bar.
    if (tMic) tMic.style.width = `${Math.min(100, Math.round(rms * 350))}%`;

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
          log("sys", `${ASSISTANT_NAME} dihentikan — mendengarkan kamu.`);
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
    renderBars(data, "#ffb01f");
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
    renderBars(data, "#ffcb5c");
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

log("sys", `${ASSISTANT_NAME} online. Menunggu perintah.`);

// --- peluncuran lewat suara (Pintasan Siri / Google Assistant) -------------
// Halaman web tidak bisa mendengarkan saat layar mati -- sistem menghentikan
// mic-nya. Yang bisa: dipanggil lewat asisten bawaan ponsel. Buat Pintasan Siri
// "FRIDAY" (atau ucapkan "Ok Google, buka FRIDAY") yang membuka URL
// "/?autostart=1"; FRIDAY langsung menyala dan mendengarkan tanpa perlu disentuh.
if (new URLSearchParams(location.search).get("autostart") === "1") {
  window.addEventListener("load", () => {
    setTimeout(() => {
      if (!active) {
        log("sys", "Dipanggil lewat pintasan suara.");
        core.click();
      }
    }, 300);
  });
}
