// Basis pengetahuan lokal Ultron. Dicek SEBELUM menghubungi otak utama
// (endpoint /api/ai/voice-assistant milik MK Connect, yang memanggil
// Gemini) -- kalau pertanyaan cocok dengan salah satu entri di sini,
// jawabannya langsung dari sini, tanpa panggilan API sama sekali. Ini
// murni untuk topik umum (apa itu asisten virtual, kemampuan Ultron
// sendiri, dst) yang jawabannya tidak berubah-ubah dan tidak butuh data
// MK Connect -- pertanyaan soal data perusahaan (absensi, memo, dst) tetap
// lewat Gemini karena butuh tool-calling ke database sungguhan.
//
// Tambah entri baru kapan saja: satu objek { keywords, answer }. keywords
// dicocokkan sebagai substring dari ucapan pengguna (huruf kecil semua),
// entri pertama yang cocok yang dipakai -- urutkan yang lebih spesifik
// duluan kalau ada potensi tumpang tindih kata kunci.

export const KNOWLEDGE_BASE = [
  {
    keywords: ["apa itu asisten pribadi virtual", "asisten pribadi virtual itu apa", "virtual personal assistant", "apa itu asisten virtual", "asisten virtual itu apa"],
    answer:
      "Asisten pribadi virtual adalah program perangkat lunak yang meniru peran asisten manusia lewat suara atau teks. Dia mendengar atau membaca perintah, memahami maksudnya lewat pemrosesan bahasa alami, lalu menjalankan tugas atau mencari jawaban. Contohnya Siri, Alexa, Google Assistant, dan aku sendiri, Ultron.",
  },
  {
    keywords: ["apa itu asisten pribadi", "asisten pribadi itu apa", "definisi asisten pribadi"],
    answer:
      "Asisten pribadi adalah orang atau sistem yang membantu mengatur pekerjaan sehari-hari seseorang, seperti jadwal, komunikasi, dan tugas administratif, supaya orang itu bisa fokus ke hal yang lebih penting.",
  },
  {
    keywords: ["bagaimana cara kerja asisten virtual", "cara kerja asisten pribadi virtual", "gimana cara kerjamu"],
    answer:
      "Asisten virtual biasanya bekerja lewat empat tahap: suara diubah jadi teks lewat speech-to-text, teks itu dipahami maksudnya oleh model bahasa, model itu memutuskan tindakan apa yang perlu diambil termasuk memanggil sistem atau data lain kalau perlu, lalu jawabannya diubah lagi jadi suara lewat text-to-speech. Aku bekerja persis dengan pola itu.",
  },
  {
    keywords: ["sejarah asisten virtual", "sejarah asisten pribadi virtual", "asisten virtual pertama"],
    answer:
      "Asisten virtual modern mulai populer sejak Siri diluncurkan Apple tahun 2011, disusul Google Now, Amazon Alexa, dan Microsoft Cortana. Sebelumnya sudah ada eksperimen chatbot berbasis teks sejak tahun 1960-an seperti ELIZA, tapi baru dengan speech recognition dan cloud computing yang cukup matang, asisten suara jadi praktis dipakai sehari-hari.",
  },
  {
    keywords: ["contoh asisten virtual", "contoh asisten pribadi virtual", "asisten virtual apa saja"],
    answer:
      "Beberapa asisten virtual yang terkenal: Siri dari Apple, Google Assistant, Amazon Alexa, Microsoft Cortana, dan Bixby dari Samsung. Selain itu banyak juga asisten virtual khusus perusahaan seperti aku, yang dibuat untuk satu organisasi tertentu, bukan untuk pasar umum.",
  },
  {
    keywords: ["kelebihan asisten virtual", "keuntungan asisten virtual", "manfaat asisten pribadi virtual"],
    answer:
      "Asisten virtual bisa bekerja dua puluh empat jam tanpa lelah, menjawab dalam hitungan detik, dan mengakses data dalam jumlah besar secara instan. Bedanya dengan asisten manusia, dia tidak bisa berinisiatif di luar apa yang dirancang atau menangani situasi yang benar-benar baru tanpa diberi tahu caranya lebih dulu.",
  },
  {
    keywords: ["siapa kamu", "kamu siapa", "kamu apa", "apa itu ultron", "ultron itu apa"],
    answer:
      "Aku Ultron, asisten suara pribadi yang tersambung ke MK Connect. Aku bisa menjawab sapaan biasa tanpa perlu mikir keras, dan untuk pertanyaan soal data perusahaan seperti absensi, memo, atau laporan AI, aku memanggil otak utamaku yang tersambung langsung ke database MK Connect.",
  },
  {
    keywords: ["apa yang bisa kamu lakukan", "kemampuan kamu", "kamu bisa apa", "fitur kamu apa"],
    answer:
      "Banyak yang bisa aku tangani sendiri tanpa memanggil otak utama: memberi tahu jam dan tanggal, berhitung, mengonversi satuan, memasang timer atau pengingat, melempar koin atau dadu, memilih angka acak, menyimpan catatan, sampai menceritakan lelucon. Untuk data MK Connect yang bisa berubah seperti absensi, memo, pengumuman, karyawan, audit media sosial, dan analisis KontenAI, aku baru memanggil otak utamaku yang tersambung langsung ke databasenya.",
  },
  {
    keywords: ["kenapa kamu tidak selalu pakai gemini", "kenapa tidak panggil gemini", "hemat token", "kenapa tidak selalu panggil ai", "kenapa tidak selalu pakai ai"],
    answer:
      "Supaya lebih hemat dan cepat. Pertanyaan yang jawabannya bisa aku hitung atau ketahui sendiri di perangkat, seperti waktu, aritmetika, konversi, atau konsep umum, aku jawab langsung tanpa panggilan API sama sekali. Aku baru memanggil otak utama kalau memang butuh data MK Connect yang bisa berubah sewaktu-waktu.",
  },
  {
    keywords: ["apa itu kecerdasan buatan", "apa itu ai", "kecerdasan buatan itu apa", "artificial intelligence"],
    answer:
      "Kecerdasan buatan, atau AI, adalah kemampuan mesin untuk melakukan hal-hal yang biasanya butuh kecerdasan manusia, seperti memahami bahasa, mengenali pola, mengambil keputusan, dan belajar dari data. Asisten suara sepertiku adalah salah satu penerapan AI yang paling umum sehari-hari.",
  },
  {
    keywords: ["apa itu machine learning", "pembelajaran mesin", "machine learning itu apa"],
    answer:
      "Machine learning, atau pembelajaran mesin, adalah cabang kecerdasan buatan di mana sistem belajar mengenali pola dari data, bukan diprogram aturannya satu per satu. Semakin banyak contoh yang dilihat, semakin baik prediksi atau keputusannya.",
  },
  {
    keywords: ["apa itu speech to text", "apa itu text to speech", "stt dan tts", "pengenalan suara"],
    answer:
      "Speech-to-text mengubah ucapan jadi teks, sementara text-to-speech mengubah teks jadi suara. Aku memakai keduanya: suaramu aku ubah jadi teks untuk aku pahami, lalu jawabanku aku ubah kembali jadi suara lewat ElevenLabs.",
  },
  {
    keywords: ["apa itu mk connect", "apa itu mkconnect", "mk connect itu apa", "mkhsistem"],
    answer:
      "MK Connect adalah sistem tempat otak utamaku tinggal. Di sanalah data perusahaan seperti absensi, memo, pengumuman, karyawan, sampai analisis media sosial dan KontenAI berada. Aku bertindak sebagai antarmuka suara ke sistem itu.",
  },
];

/** Substring match sederhana terhadap teks pengguna (sudah huruf kecil). Null kalau tidak ada yang cocok. */
export function findLocalAnswer(userText) {
  const text = userText.toLowerCase();
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.keywords.some((keyword) => text.includes(keyword))) {
      return entry.answer;
    }
  }
  return null;
}
