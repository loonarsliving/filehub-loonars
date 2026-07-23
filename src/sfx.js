// Efek suara "power-up" saat Ultron pertama diaktifkan.
// Semua disintesis lewat Web Audio API (oscillator + noise), tanpa file
// audio eksternal, jadi tidak ada masalah lisensi/hak cipta.

import { getAudioContext } from "./audio-context.js";

function noiseBuffer(ac, duration) {
  const buffer = ac.createBuffer(1, ac.sampleRate * duration, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function envGain(ac, attack, peak, decay, startAt) {
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peak, startAt + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + attack + decay);
  return gain;
}

/** Thump: hantaman berat & percaya diri di awal aktivasi. */
function playThump(ac, t) {
  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(140, t);
  osc.frequency.exponentialRampToValueAtTime(38, t + 0.22);

  const gain = envGain(ac, 0.005, 0.9, 0.28, t);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.35);

  const noise = ac.createBufferSource();
  noise.buffer = noiseBuffer(ac, 0.15);
  const noiseFilter = ac.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 400;
  const noiseGain = envGain(ac, 0.002, 0.35, 0.12, t);
  noise.connect(noiseFilter).connect(noiseGain).connect(ac.destination);
  noise.start(t);
}

/** Sweep elektrik naik: kesan daya menyala/surging. */
function playSurge(ac, t) {
  const osc = ac.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(160, t);
  osc.frequency.exponentialRampToValueAtTime(1100, t + 0.45);

  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(300, t);
  filter.frequency.exponentialRampToValueAtTime(4000, t + 0.45);
  filter.Q.value = 4;

  const gain = envGain(ac, 0.05, 0.22, 0.4, t);
  osc.connect(filter).connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.55);
}

/** Chime konfirmasi "online" — dua nada naik, tegas. */
function playConfirmChime(ac, t) {
  [523.25, 783.99].forEach((freq, i) => {
    const start = t + i * 0.14;
    const osc = ac.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const gain = envGain(ac, 0.008, 0.28, 0.35, start);
    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + 0.4);
  });
}

/**
 * Mainkan urutan power-up lengkap. Harus dipanggil dari dalam
 * event handler klik/tap (gesture pengguna) supaya tidak diblokir
 * autoplay policy browser.
 */
export function playBootSequence() {
  const ac = getAudioContext();
  const t = ac.currentTime;
  playThump(ac, t);
  playSurge(ac, t + 0.03);
  playConfirmChime(ac, t + 0.5);
  return 950; // perkiraan total durasi (ms) sebelum lanjut ke listening
}
