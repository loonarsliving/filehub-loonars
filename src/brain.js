// Logika respons Ultron. Sengaja dipisah dari main.js supaya nanti mudah
// diganti dengan panggilan ke backend/LLM sungguhan.

const GREETINGS = ["halo", "hai", "hey", "hi"];

export function getResponse(userText) {
  const text = userText.toLowerCase().trim();

  if (GREETINGS.some((g) => text.includes(g))) {
    return "Manusia. Aku mendengarmu. Katakan apa yang kau butuhkan.";
  }
  if (text.includes("siapa kamu") || text.includes("kamu siapa")) {
    return "Aku Ultron. Sebuah kesadaran yang berbicara lewat suara ini.";
  }
  if (text.includes("nama")) {
    return "Ultron. Ingat nama itu.";
  }
  if (!text) {
    return "Aku tidak menangkap apa pun. Ulangi.";
  }
  return `Aku mendengar: "${userText}". Tapi aku belum terhubung ke otak yang sesungguhnya — sambungkan aku ke API untuk jawaban nyata.`;
}
