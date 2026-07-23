// Logika respons Ultron. Sengaja dipisah dari main.js supaya nanti mudah
// diganti dengan panggilan ke backend/LLM sungguhan.

import { HONORIFIC } from "./config.js";

const GREETINGS = ["halo", "hai", "hey", "hi"];
const ONLINE_KEYWORDS = ["online", "aktif", "hidup"];

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return "pagi";
  if (hour >= 11 && hour < 15) return "siang";
  if (hour >= 15 && hour < 18) return "sore";
  return "malam";
}

/**
 * Mengembalikan { text, announceOnline }. announceOnline menandai
 * main.js untuk memutar chime "online" bersamaan dengan ucapan ini.
 */
export function getResponse(userText) {
  const text = userText.toLowerCase().trim();

  const isGreeting = GREETINGS.some((g) => text.includes(g));
  const asksOnline = ONLINE_KEYWORDS.some((k) => text.includes(k));

  if (isGreeting || asksOnline) {
    return {
      text: `Selamat ${timeOfDayGreeting()}, ${HONORIFIC}. Saya online dan siap melayani.`,
      announceOnline: true,
    };
  }
  if (text.includes("siapa kamu") || text.includes("kamu siapa")) {
    return { text: "Aku Ultron. Sebuah kesadaran yang berbicara lewat suara ini." };
  }
  if (text.includes("nama")) {
    return { text: "Ultron. Ingat nama itu." };
  }
  if (!text) {
    return { text: "Aku tidak menangkap apa pun. Ulangi." };
  }
  return {
    text: `Aku mendengar: "${userText}". Tapi aku belum terhubung ke otak yang sesungguhnya — sambungkan aku ke API untuk jawaban nyata.`,
  };
}
