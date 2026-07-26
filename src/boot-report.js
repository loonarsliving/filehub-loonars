// Laporan saat FRIDAY dibangunkan — "siap online, seluruh sistem aktif",
// lalu langsung melaporkan keadaan MK Connect dan lini bisnis lain.
//
// ---------------------------------------------------------------------------
// KENAPA DIPECAH JADI POTONGAN, BUKAN SATU KALIMAT PANJANG
// ---------------------------------------------------------------------------
// tts-cache.js menyimpan audio berdasarkan TEKS PERSIS. Satu kalimat panjang
// yang memuat angka hari ini ("6 lini bisnis, 1 terbaca, 5 belum terhubung")
// tidak akan pernah cocok dengan kalimat besok — jadi setiap kali dibangunkan,
// seluruh sapaan itu harus dibuat ulang lewat ElevenLabs. Lambat, dan berbiaya
// setiap kali.
//
// Karena itu laporan ini dipecah: bagian yang TIDAK PERNAH berubah ("Selamat
// pagi, Bos.", "Seluruh sistem aktif.") jadi potongan tersendiri yang cukup
// dibuat SEKALI seumur hidup perangkat, lalu selamanya diputar dari
// penyimpanan lokal. Yang tersisa untuk dibuat baru hanyalah potongan berisi
// angka — pendek, dan angkanya pun berulang dari hari ke hari sehingga ikut
// tersimpan.
//
// Hasilnya persis seperti yang diminta: yang diputar adalah rekaman, dan yang
// berganti hanya angkanya. Jeda tipis antar potongan bukan cacat — justru
// membuatnya terdengar seperti laporan sistem, bukan satu tarikan napas.
//
// Satu-satunya bagian yang memang berubah tiap hari adalah headline temuan.
// Itu wajar: isinya memang berita hari itu, dan sekali sehari adalah harga yang
// pantas untuk FRIDAY yang benar-benar melaporkan sesuatu.

import { HONORIFIC } from "./config.js";

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return "pagi";
  if (hour >= 11 && hour < 15) return "siang";
  if (hour >= 15 && hour < 18) return "sore";
  return "malam";
}

/**
 * Potongan yang tidak pernah berubah. Semua ini di-prewarm sekali saat
 * perangkat menganggur, sehingga pembangunan berikutnya tidak menyentuh
 * jaringan sama sekali.
 */
export const FIXED_BOOT_PHRASES = [
  `Selamat pagi, ${HONORIFIC}. Saya online.`,
  `Selamat siang, ${HONORIFIC}. Saya online.`,
  `Selamat sore, ${HONORIFIC}. Saya online.`,
  `Selamat malam, ${HONORIFIC}. Saya online.`,
  "Seluruh sistem aktif.",
  "Status MK Connect normal.",
  "Status MK Connect perlu perhatian.",
  "Status MK Connect kritis.",
  "Belum ada briefing eksekutif terbaru.",
  "Saya belum login ke MK Connect, jadi data grup belum bisa saya baca.",
  "Jembatan ke lini bisnis sedang tidak bisa saya baca.",
  "Semua lini bisnis terbaca.",
];

const SEVERITY_LINE = {
  normal: "Status MK Connect normal.",
  perhatian: "Status MK Connect perlu perhatian.",
  kritis: "Status MK Connect kritis.",
};

/**
 * Susun laporan bangun jadi daftar potongan siap ucap.
 *
 * `snapshot` boleh null (jembatan gagal / belum login) — laporannya tetap
 * keluar, hanya lebih pendek. FRIDAY yang dibangunkan lalu diam adalah FRIDAY
 * yang terlihat rusak, bahkan ketika penyebabnya cuma belum login.
 */
export function buildBootReport(snapshot) {
  const lines = [`Selamat ${timeOfDayGreeting()}, ${HONORIFIC}. Saya online.`, "Seluruh sistem aktif."];

  if (!snapshot) {
    lines.push("Jembatan ke lini bisnis sedang tidak bisa saya baca.");
    return lines;
  }

  const { total, terbaca, belumTerhubung, tidakTerhubungi } = snapshot;

  // Tiap angka jadi potongan pendeknya sendiri supaya cocok dengan cache
  // berkali-kali: "1 terbaca" hari ini sama persis dengan "1 terbaca" minggu
  // depan.
  lines.push(`${total} lini bisnis terpantau.`);
  if (terbaca > 0) lines.push(`${terbaca} terbaca.`);
  if (belumTerhubung > 0) lines.push(`${belumTerhubung} belum terhubung.`);
  if (tidakTerhubungi > 0) lines.push(`${tidakTerhubungi} tidak dapat dihubungi.`);
  if (belumTerhubung === 0 && tidakTerhubungi === 0) lines.push("Semua lini bisnis terbaca.");

  const holding = snapshot.businesses?.find((b) => b.key === "mkconnect");

  if (holding?.health === "ok") {
    if (holding.severity && SEVERITY_LINE[holding.severity]) {
      lines.push(SEVERITY_LINE[holding.severity]);
    }
    // Satu-satunya potongan yang memang baru tiap hari.
    if (holding.headline) lines.push(holding.headline);
  } else if (holding?.health === "belum_terhubung") {
    lines.push("Saya belum login ke MK Connect, jadi data grup belum bisa saya baca.");
  } else if (holding?.note) {
    lines.push(holding.note);
  } else {
    lines.push("Belum ada briefing eksekutif terbaru.");
  }

  return lines;
}

/** Versi satu baris untuk subtitle/log — bukan untuk diucapkan. */
export function bootReportText(lines) {
  return lines.join(" ");
}
