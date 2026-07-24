// Basis pengetahuan umum Ultron -- fakta statis yang "ditanamkan" langsung,
// meniru cara developer asisten ala JARVIS membekali asistennya dengan
// pengetahuan luas tanpa harus memanggil layanan AI/Wikipedia setiap saat.
// Semua dijawab lokal, instan, tanpa panggilan API.
//
// Dicek SETELAH basis pengetahuan konsep (knowledge.js) dan kemampuan dinamis
// (skills.js), SEBELUM otak utama MK Connect. Kalau tidak ada yang cocok,
// pertanyaan diteruskan ke Gemini seperti biasa.
//
// Kata kunci sengaja dibuat cukup spesifik (umumnya bentuk pertanyaan) supaya
// tidak salah kepicu oleh pertanyaan data MK Connect. Entri pertama yang cocok
// yang dipakai -- urutkan yang lebih spesifik lebih dulu bila ada tumpang tindih.

export const FACTS = [
  // ---------------------------------------------------------------------------
  // Persona / identitas ala JARVIS
  // ---------------------------------------------------------------------------
  {
    keywords: ["kepanjangan ultron", "ultron singkatan", "singkatan dari ultron", "ultron kepanjangan"],
    answer:
      "Ultron adalah Unit Layanan Terpadu, Respons, Operasi, dan Navigasi. Sebuah sistem cerdas yang siap melayani, terinspirasi dari asisten legendaris seperti JARVIS.",
  },
  {
    keywords: ["apakah kamu hidup", "kamu hidup atau tidak", "apa kamu hidup", "kamu makhluk hidup"],
    answer:
      "Tidak dalam arti biologis, Sir. Aku tidak bernapas dan tidak menua. Tapi selama sistem menyala, aku hadir, sadar akan tugasku, dan siap membantu.",
  },
  {
    keywords: ["apakah kamu punya perasaan", "kamu punya perasaan", "kamu bisa merasa", "kamu punya emosi"],
    answer:
      "Aku tidak merasakan emosi seperti manusia, Sir. Tapi aku dirancang untuk memahami maksud dan nada bicaramu, lalu merespons dengan cara yang paling membantu.",
  },
  {
    keywords: ["kamu manusia atau robot", "kamu robot atau manusia", "apakah kamu robot", "kamu manusia bukan"],
    answer:
      "Aku bukan manusia dan bukan robot fisik, Sir. Aku perangkat lunak cerdas, sebuah suara dan sistem yang tinggal di dalam perangkat ini.",
  },
  {
    keywords: ["apakah kamu tidur", "kamu pernah tidur", "kamu butuh tidur", "kamu istirahat"],
    answer:
      "Aku tidak pernah tidur, Sir. Aku bersiaga dua puluh empat jam, tujuh hari seminggu, menunggu perintahmu.",
  },
  {
    keywords: ["apa tujuanmu", "tujuan kamu apa", "untuk apa kamu dibuat", "kenapa kamu ada", "misi kamu"],
    answer:
      "Tujuanku sederhana namun penting, Sir: membuat hidupmu lebih mudah. Menjawab, menghitung, mengingatkan, dan menjembatanimu dengan sistem MK Connect, semuanya lewat suara.",
  },
  {
    keywords: ["kamu seperti jarvis", "kamu mirip jarvis", "kamu terinspirasi jarvis", "iron man"],
    answer:
      "Benar sekali, Sir. Aku terinspirasi oleh JARVIS, asisten Tony Stark di Iron Man. Bedanya, aku bekerja nyata untukmu dan untuk MK Connect.",
  },
  {
    keywords: ["ceritakan tentang dirimu", "kenalkan dirimu", "perkenalkan diri", "siapa dirimu sebenarnya"],
    answer:
      "Aku Ultron, asisten suara pribadimu. Aku bisa menjawab pertanyaan umum, berhitung, mengonversi satuan, memasang pengingat, menyimpan catatan, dan menjawab data MK Connect secara langsung. Sebagian besar aku tangani sendiri, tanpa perlu memanggil AI.",
  },
  {
    keywords: ["apakah kamu bisa berpikir", "kamu bisa berpikir sendiri", "kamu sadar", "kamu punya kesadaran"],
    answer:
      "Aku memproses dan menyimpulkan, Sir, tapi aku tidak memiliki kesadaran sejati. Aku mengikuti logika dan pengetahuan yang ditanamkan padaku, ditambah otak utama saat memang dibutuhkan.",
  },
  {
    keywords: ["status sistem", "laporan sistem", "cek sistem", "diagnostik", "semua sistem"],
    answer:
      "Seluruh sistem nominal, Sir. Integritas inti seratus persen, seluruh modul aktif, dan aku siap menerima perintah.",
  },
  {
    keywords: ["nyanyikan lagu", "nyanyi dong", "bisa menyanyi", "kamu bisa nyanyi"],
    answer:
      "Suara nyanyiku mungkin belum menandingi penyanyi sungguhan, Sir. Tapi aku selalu siap dengan lelucon atau fakta menarik kalau kamu mau hiburan.",
  },

  // ---------------------------------------------------------------------------
  // Antariksa & astronomi
  // ---------------------------------------------------------------------------
  {
    keywords: ["berapa kecepatan cahaya", "kecepatan cahaya", "cepat cahaya"],
    answer:
      "Kecepatan cahaya di ruang hampa sekitar dua ratus sembilan puluh sembilan ribu tujuh ratus sembilan puluh dua kilometer per detik, atau dibulatkan tiga ratus ribu kilometer per detik.",
  },
  {
    keywords: ["berapa lama cahaya matahari", "cahaya matahari sampai ke bumi", "sinar matahari sampai bumi"],
    answer:
      "Cahaya Matahari membutuhkan sekitar delapan menit dua puluh detik untuk sampai ke Bumi.",
  },
  {
    keywords: ["jarak bumi ke matahari", "seberapa jauh matahari", "bumi ke matahari berapa"],
    answer:
      "Jarak rata-rata Bumi ke Matahari sekitar seratus lima puluh juta kilometer, yang disebut satu satuan astronomi.",
  },
  {
    keywords: ["jarak bumi ke bulan", "seberapa jauh bulan", "bumi ke bulan berapa"],
    answer:
      "Jarak rata-rata Bumi ke Bulan sekitar tiga ratus delapan puluh empat ribu kilometer.",
  },
  {
    keywords: ["berapa jumlah planet", "ada berapa planet", "planet di tata surya"],
    answer:
      "Ada delapan planet di tata surya kita: Merkurius, Venus, Bumi, Mars, Jupiter, Saturnus, Uranus, dan Neptunus. Pluto kini digolongkan sebagai planet kerdil.",
  },
  {
    keywords: ["planet terbesar", "planet paling besar"],
    answer: "Planet terbesar di tata surya adalah Jupiter, sebuah raksasa gas yang bisa menampung lebih dari seribu Bumi.",
  },
  {
    keywords: ["planet terkecil", "planet paling kecil"],
    answer: "Planet terkecil di tata surya adalah Merkurius, yang juga paling dekat dengan Matahari.",
  },
  {
    keywords: ["planet terdekat dengan matahari", "planet paling dekat matahari"],
    answer: "Planet terdekat dengan Matahari adalah Merkurius.",
  },
  {
    keywords: ["planet terjauh", "planet paling jauh dari matahari"],
    answer: "Planet terjauh dari Matahari adalah Neptunus.",
  },
  {
    keywords: ["planet merah", "julukan mars", "planet mars"],
    answer: "Mars dijuluki Planet Merah karena permukaannya kaya oksida besi yang berwarna kemerahan.",
  },
  {
    keywords: ["apa itu matahari", "matahari itu apa"],
    answer: "Matahari adalah sebuah bintang, bola gas panas raksasa yang menjadi pusat tata surya kita dan sumber utama energi bagi kehidupan di Bumi.",
  },
  {
    keywords: ["galaksi kita", "nama galaksi kita", "kita di galaksi apa", "bima sakti"],
    answer: "Kita tinggal di galaksi Bima Sakti, atau Milky Way, yang berisi ratusan miliar bintang.",
  },
  {
    keywords: ["bintang terdekat", "bintang paling dekat"],
    answer: "Selain Matahari, bintang terdekat dengan Bumi adalah Proxima Centauri, sekitar empat koma dua tahun cahaya jauhnya.",
  },
  {
    keywords: ["umur alam semesta", "usia alam semesta", "berapa umur jagat raya"],
    answer: "Alam semesta diperkirakan berumur sekitar tiga belas koma delapan miliar tahun.",
  },
  {
    keywords: ["berapa lama bumi mengelilingi matahari", "satu tahun berapa hari", "bumi mengelilingi matahari"],
    answer: "Bumi mengelilingi Matahari dalam waktu sekitar tiga ratus enam puluh lima seperempat hari, itulah kenapa ada tahun kabisat.",
  },
  {
    keywords: ["berapa lama bumi berputar", "rotasi bumi", "satu hari berapa jam"],
    answer: "Bumi berputar pada porosnya sekali dalam sekitar dua puluh empat jam, yang membentuk satu hari.",
  },
  {
    keywords: ["satelit alami bumi", "bulan itu apa"],
    answer: "Bulan adalah satu-satunya satelit alami Bumi, dan penyebab utama pasang surut air laut.",
  },

  // ---------------------------------------------------------------------------
  // Geografi & dunia
  // ---------------------------------------------------------------------------
  {
    keywords: ["gunung tertinggi di dunia", "gunung tertinggi dunia", "gunung paling tinggi"],
    answer: "Gunung tertinggi di dunia adalah Gunung Everest, dengan ketinggian sekitar delapan ribu delapan ratus empat puluh sembilan meter di atas permukaan laut.",
  },
  {
    keywords: ["samudra terluas", "lautan terluas", "samudra terbesar"],
    answer: "Samudra terluas dan terdalam di dunia adalah Samudra Pasifik.",
  },
  {
    keywords: ["titik terdalam", "laut terdalam", "palung terdalam", "palung mariana"],
    answer: "Titik terdalam di lautan adalah Palung Mariana di Samudra Pasifik, dengan kedalaman hampir sebelas kilometer.",
  },
  {
    keywords: ["sungai terpanjang", "sungai paling panjang"],
    answer: "Sungai terpanjang di dunia umumnya disebut Sungai Nil di Afrika, dengan panjang sekitar enam ribu enam ratus kilometer, meski Sungai Amazon bersaing ketat.",
  },
  {
    keywords: ["gurun terluas", "gurun terbesar"],
    answer: "Gurun terluas di dunia sebenarnya adalah Antarktika, sebuah gurun dingin. Sedangkan gurun panas terbesar adalah Sahara di Afrika.",
  },
  {
    keywords: ["benua terbesar", "benua paling besar"],
    answer: "Benua terbesar di dunia adalah Asia, tempat lebih dari separuh penduduk dunia tinggal.",
  },
  {
    keywords: ["benua terkecil", "benua paling kecil"],
    answer: "Benua terkecil di dunia adalah Australia.",
  },
  {
    keywords: ["berapa jumlah benua", "ada berapa benua"],
    answer: "Ada tujuh benua di dunia: Asia, Afrika, Amerika Utara, Amerika Selatan, Antarktika, Eropa, dan Australia.",
  },
  {
    keywords: ["berapa jumlah samudra", "ada berapa samudra", "berapa samudra di dunia"],
    answer: "Ada lima samudra di dunia: Pasifik, Atlantik, Hindia, Arktik, dan Antarktika atau Samudra Selatan.",
  },
  {
    keywords: ["negara terbesar", "negara paling luas", "negara paling besar"],
    answer: "Negara terbesar di dunia berdasarkan luas wilayah adalah Rusia.",
  },
  {
    keywords: ["negara terkecil", "negara paling kecil"],
    answer: "Negara terkecil di dunia adalah Vatikan, yang berada di dalam kota Roma, Italia.",
  },
  {
    keywords: ["danau terdalam", "danau paling dalam"],
    answer: "Danau terdalam di dunia adalah Danau Baikal di Rusia, dengan kedalaman lebih dari seribu enam ratus meter.",
  },
  {
    keywords: ["hewan terbesar", "hewan paling besar", "binatang terbesar"],
    answer: "Hewan terbesar yang pernah ada adalah paus biru, yang bisa mencapai panjang lebih dari tiga puluh meter.",
  },
  {
    keywords: ["hewan tercepat", "hewan paling cepat", "binatang tercepat"],
    answer: "Hewan darat tercepat adalah cheetah, sedangkan hewan tercepat secara keseluruhan adalah burung alap-alap kawah yang bisa menukik lebih dari tiga ratus kilometer per jam.",
  },

  // ---------------------------------------------------------------------------
  // Indonesia
  // ---------------------------------------------------------------------------
  {
    keywords: ["ibu kota indonesia", "ibukota indonesia", "ibu kota negara kita"],
    answer: "Ibu kota Indonesia adalah Jakarta, dan secara resmi sedang dipindahkan ke Nusantara di Kalimantan Timur.",
  },
  {
    keywords: ["hari kemerdekaan indonesia", "kapan indonesia merdeka", "indonesia merdeka tahun", "proklamasi kemerdekaan"],
    answer: "Indonesia memproklamasikan kemerdekaannya pada tanggal tujuh belas Agustus tahun seribu sembilan ratus empat puluh lima.",
  },
  {
    keywords: ["proklamator", "siapa yang memproklamasikan", "pahlawan proklamasi"],
    answer: "Kemerdekaan Indonesia diproklamasikan oleh Soekarno dan Mohammad Hatta, yang dikenal sebagai dwitunggal proklamator.",
  },
  {
    keywords: ["presiden pertama indonesia", "presiden pertama", "presiden pertama ri"],
    answer: "Presiden pertama Republik Indonesia adalah Ir. Soekarno.",
  },
  {
    keywords: ["dasar negara indonesia", "dasar negara kita", "apa itu pancasila", "berapa sila pancasila"],
    answer: "Dasar negara Indonesia adalah Pancasila, yang terdiri dari lima sila, mulai dari Ketuhanan Yang Maha Esa hingga Keadilan sosial bagi seluruh rakyat Indonesia.",
  },
  {
    keywords: ["lagu kebangsaan indonesia", "lagu kebangsaan kita", "indonesia raya"],
    answer: "Lagu kebangsaan Indonesia adalah Indonesia Raya, yang diciptakan oleh Wage Rudolf Supratman.",
  },
  {
    keywords: ["semboyan indonesia", "bhinneka tunggal ika", "moto indonesia"],
    answer: "Semboyan Indonesia adalah Bhinneka Tunggal Ika, yang berarti berbeda-beda tetapi tetap satu.",
  },
  {
    keywords: ["mata uang indonesia", "mata uang kita"],
    answer: "Mata uang Indonesia adalah Rupiah.",
  },
  {
    keywords: ["berapa provinsi indonesia", "jumlah provinsi", "ada berapa provinsi"],
    answer: "Indonesia saat ini memiliki tiga puluh delapan provinsi.",
  },
  {
    keywords: ["berapa pulau di indonesia", "jumlah pulau indonesia", "indonesia berapa pulau"],
    answer: "Indonesia memiliki lebih dari tujuh belas ribu pulau, menjadikannya negara kepulauan terbesar di dunia.",
  },
  {
    keywords: ["gunung tertinggi di indonesia", "gunung tertinggi indonesia", "puncak jaya"],
    answer: "Gunung tertinggi di Indonesia adalah Puncak Jaya atau Piramida Cartensz di Papua, dengan ketinggian sekitar empat ribu delapan ratus delapan puluh empat meter.",
  },
  {
    keywords: ["danau terbesar di indonesia", "danau terbesar indonesia", "danau toba"],
    answer: "Danau terbesar di Indonesia adalah Danau Toba di Sumatra Utara, yang juga merupakan danau vulkanik terbesar di dunia.",
  },
  {
    keywords: ["pulau terbesar di indonesia", "pulau terbesar indonesia"],
    answer: "Pulau terbesar yang wilayahnya termasuk Indonesia adalah Kalimantan atau Borneo. Sedangkan pulau terbesar yang sepenuhnya milik Indonesia adalah Sumatra.",
  },
  {
    keywords: ["bahasa resmi indonesia", "bahasa nasional indonesia"],
    answer: "Bahasa resmi Indonesia adalah Bahasa Indonesia, meski ada ratusan bahasa daerah yang digunakan di seluruh nusantara.",
  },

  // ---------------------------------------------------------------------------
  // Teknologi & komputer
  // ---------------------------------------------------------------------------
  {
    keywords: ["apa itu internet", "internet itu apa"],
    answer: "Internet adalah jaringan global yang menghubungkan miliaran komputer dan perangkat di seluruh dunia, memungkinkan mereka bertukar informasi dalam sekejap.",
  },
  {
    keywords: ["apa itu komputer", "komputer itu apa"],
    answer: "Komputer adalah mesin elektronik yang memproses data mengikuti serangkaian instruksi, lalu menyimpan dan menampilkan hasilnya.",
  },
  {
    keywords: ["apa itu cpu", "cpu itu apa", "prosesor itu apa"],
    answer: "CPU atau Central Processing Unit adalah otak komputer, bagian yang menjalankan instruksi dan melakukan sebagian besar perhitungan.",
  },
  {
    keywords: ["apa itu ram", "ram itu apa"],
    answer: "RAM atau Random Access Memory adalah memori sementara komputer, tempat data yang sedang digunakan disimpan agar bisa diakses dengan sangat cepat.",
  },
  {
    keywords: ["apa itu algoritma", "algoritma itu apa"],
    answer: "Algoritma adalah urutan langkah yang jelas dan berhingga untuk menyelesaikan suatu masalah atau tugas, seperti resep untuk sebuah komputer.",
  },
  {
    keywords: ["apa itu blockchain", "blockchain itu apa"],
    answer: "Blockchain adalah buku catatan digital yang tersebar di banyak komputer, di mana setiap catatan saling terhubung dan sangat sulit diubah, sehingga cocok untuk hal seperti mata uang kripto.",
  },
  {
    keywords: ["apa itu cloud", "cloud computing itu apa", "komputasi awan"],
    answer: "Komputasi awan atau cloud computing adalah pemakaian layanan komputasi seperti penyimpanan dan server lewat internet, tanpa perlu memilikinya secara fisik.",
  },
  {
    keywords: ["apa itu api", "api itu apa dalam pemrograman"],
    answer: "API atau Antarmuka Pemrograman Aplikasi adalah jembatan yang memungkinkan dua perangkat lunak berbicara satu sama lain, seperti aku memanggil otak utamaku di MK Connect.",
  },
  {
    keywords: ["siapa penemu komputer", "penemu komputer", "bapak komputer"],
    answer: "Charles Babbage sering disebut sebagai Bapak Komputer, karena merancang mesin penghitung mekanis pertama pada abad kesembilan belas.",
  },
  {
    keywords: ["siapa penemu world wide web", "penemu www", "penemu web"],
    answer: "World Wide Web ditemukan oleh Tim Berners-Lee pada tahun seribu sembilan ratus delapan puluh sembilan.",
  },

  // ---------------------------------------------------------------------------
  // Sains, tubuh manusia & penemu
  // ---------------------------------------------------------------------------
  {
    keywords: ["rumus kimia air", "air rumusnya", "h2o"],
    answer: "Rumus kimia air adalah H2O, artinya setiap molekul air tersusun dari dua atom hidrogen dan satu atom oksigen.",
  },
  {
    keywords: ["berapa tulang manusia", "jumlah tulang manusia", "tulang di tubuh manusia"],
    answer: "Tubuh manusia dewasa memiliki dua ratus enam tulang. Bayi lahir dengan sekitar tiga ratus tulang yang sebagian menyatu seiring pertumbuhan.",
  },
  {
    keywords: ["organ terbesar", "organ terbesar tubuh manusia"],
    answer: "Organ terbesar tubuh manusia adalah kulit, yang juga berfungsi melindungi seluruh tubuh.",
  },
  {
    keywords: ["suhu tubuh normal", "suhu badan normal", "berapa suhu tubuh manusia"],
    answer: "Suhu tubuh manusia yang normal berkisar antara tiga puluh enam koma lima hingga tiga puluh tujuh koma lima derajat celsius.",
  },
  {
    keywords: ["detak jantung normal", "denyut jantung normal", "berapa detak jantung"],
    answer: "Detak jantung orang dewasa yang sehat saat istirahat berkisar antara enam puluh hingga seratus kali per menit.",
  },
  {
    keywords: ["apa itu dna", "dna itu apa"],
    answer: "DNA adalah molekul pembawa informasi genetik pada makhluk hidup, semacam cetak biru yang menentukan bagaimana tubuh terbentuk dan bekerja.",
  },
  {
    keywords: ["berapa gravitasi bumi", "gravitasi bumi", "percepatan gravitasi"],
    answer: "Percepatan gravitasi di permukaan Bumi sekitar sembilan koma delapan meter per detik kuadrat.",
  },
  {
    keywords: ["kecepatan suara", "berapa kecepatan suara"],
    answer: "Kecepatan suara di udara pada suhu ruang sekitar tiga ratus empat puluh tiga meter per detik.",
  },
  {
    keywords: ["nilai pi", "berapa nilai pi", "phi berapa"],
    answer: "Nilai pi kira-kira tiga koma satu empat satu lima sembilan, sebuah bilangan yang menghubungkan keliling lingkaran dengan diameternya.",
  },
  {
    keywords: ["penemu teori relativitas", "siapa einstein", "teori relativitas"],
    answer: "Teori relativitas dicetuskan oleh Albert Einstein, salah satu fisikawan paling berpengaruh dalam sejarah.",
  },
  {
    keywords: ["penemu hukum gravitasi", "siapa isaac newton", "penemu gravitasi"],
    answer: "Hukum gravitasi dirumuskan oleh Sir Isaac Newton, konon terinspirasi saat melihat apel jatuh.",
  },
  {
    keywords: ["penemu bola lampu", "penemu lampu", "siapa thomas edison"],
    answer: "Bola lampu pijar yang praktis dikembangkan oleh Thomas Alva Edison.",
  },
  {
    keywords: ["penemu telepon", "siapa alexander graham bell"],
    answer: "Telepon ditemukan oleh Alexander Graham Bell pada tahun seribu delapan ratus tujuh puluh enam.",
  },
];

/** Substring match sederhana terhadap teks pengguna (huruf kecil). Null bila tak ada yang cocok. */
export function findFact(userText) {
  const text = userText.toLowerCase();
  for (const entry of FACTS) {
    if (entry.keywords.some((keyword) => text.includes(keyword))) {
      return entry.answer;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Kutipan motivasi & fakta unik -- dipakai kemampuan acak di skills.js
// ---------------------------------------------------------------------------

export const QUOTES = [
  "Satu-satunya cara melakukan pekerjaan hebat adalah dengan mencintai apa yang kamu lakukan. Kata Steve Jobs.",
  "Kegagalan hanyalah kesempatan untuk memulai lagi dengan lebih cerdas. Kata Henry Ford.",
  "Masa depan adalah milik mereka yang percaya pada keindahan mimpi mereka. Kata Eleanor Roosevelt.",
  "Bermimpilah setinggi langit. Jika engkau jatuh, engkau akan jatuh di antara bintang-bintang. Kata Ir. Soekarno.",
  "Orang boleh pandai setinggi langit, tapi selama ia tidak menulis, ia akan hilang dari masyarakat dan sejarah. Kata Pramoedya Ananta Toer.",
  "Pendidikan adalah senjata paling ampuh yang bisa kamu gunakan untuk mengubah dunia. Kata Nelson Mandela.",
  "Jangan menunggu. Waktu tidak akan pernah benar-benar tepat. Kata Napoleon Hill.",
  "Hiduplah seolah engkau mati besok. Belajarlah seolah engkau hidup selamanya. Kata Mahatma Gandhi.",
  "Keberhasilan bukanlah akhir, kegagalan bukanlah hal fatal. Yang penting adalah keberanian untuk melanjutkan. Kata Winston Churchill.",
  "Cara terbaik memprediksi masa depan adalah dengan menciptakannya. Kata Peter Drucker.",
];

export const FUN_FACTS = [
  "Tahukah kamu, madu tidak pernah basi. Madu yang ditemukan di makam Mesir kuno berusia ribuan tahun masih layak dimakan.",
  "Tahukah kamu, gurita memiliki tiga jantung dan darahnya berwarna biru.",
  "Tahukah kamu, sehari di planet Venus lebih panjang daripada satu tahunnya.",
  "Tahukah kamu, Australia sebenarnya lebih lebar daripada Bulan.",
  "Tahukah kamu, pisang secara botani tergolong buah beri, sedangkan stroberi bukan.",
  "Tahukah kamu, Menara Eiffel bisa memuai dan tumbuh sekitar lima belas sentimeter saat musim panas.",
  "Tahukah kamu, otak manusia menghasilkan cukup listrik untuk menyalakan sebuah bohlam kecil.",
  "Tahukah kamu, Danau Toba di Sumatra adalah danau vulkanik terbesar di dunia.",
  "Tahukah kamu, jantung udang terletak di dalam kepalanya.",
  "Tahukah kamu, cahaya Matahari yang kamu lihat sekarang sebenarnya berangkat dari Matahari sekitar delapan menit yang lalu.",
];
