// AudioContext bersama, dibuka sekali lewat gesture klik pengguna (lihat
// unlockAudioPlayback di main.js) supaya playback TTS berikutnya lolos dari
// pembatasan autoplay browser meski dipicu jauh setelah klik itu sendiri.

let ctx = null;

export function getAudioContext() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
