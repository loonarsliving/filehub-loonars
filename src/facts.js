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

import { findAnswer } from "./match.js";

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
      "Tidak dalam arti biologis, Bos. Aku tidak bernapas dan tidak menua. Tapi selama sistem menyala, aku hadir, sadar akan tugasku, dan siap membantu.",
  },
  {
    keywords: ["apakah kamu punya perasaan", "kamu punya perasaan", "kamu bisa merasa", "kamu punya emosi"],
    answer:
      "Aku tidak merasakan emosi seperti manusia, Bos. Tapi aku dirancang untuk memahami maksud dan nada bicaramu, lalu merespons dengan cara yang paling membantu.",
  },
  {
    keywords: ["kamu manusia atau robot", "kamu robot atau manusia", "apakah kamu robot", "kamu manusia bukan"],
    answer:
      "Aku bukan manusia dan bukan robot fisik, Bos. Aku perangkat lunak cerdas, sebuah suara dan sistem yang tinggal di dalam perangkat ini.",
  },
  {
    keywords: ["apakah kamu tidur", "kamu pernah tidur", "kamu butuh tidur", "kamu istirahat"],
    answer:
      "Aku tidak pernah tidur, Bos. Aku bersiaga dua puluh empat jam, tujuh hari seminggu, menunggu perintahmu.",
  },
  {
    keywords: ["apa tujuanmu", "tujuan kamu apa", "untuk apa kamu dibuat", "kenapa kamu ada", "misi kamu"],
    answer:
      "Tujuanku sederhana namun penting, Bos: membuat hidupmu lebih mudah. Menjawab, menghitung, mengingatkan, dan menjembatanimu dengan sistem MK Connect, semuanya lewat suara.",
  },
  {
    keywords: ["kamu seperti jarvis", "kamu mirip jarvis", "kamu terinspirasi jarvis", "iron man"],
    answer:
      "Benar sekali, Bos. Aku terinspirasi oleh JARVIS, asisten Tony Stark di Iron Man. Bedanya, aku bekerja nyata untukmu dan untuk MK Connect.",
  },
  {
    keywords: ["ceritakan tentang dirimu", "kenalkan dirimu", "perkenalkan diri", "siapa dirimu sebenarnya"],
    answer:
      "Aku Ultron, asisten suara pribadimu. Aku bisa menjawab pertanyaan umum, berhitung, mengonversi satuan, memasang pengingat, menyimpan catatan, dan menjawab data MK Connect secara langsung. Sebagian besar aku tangani sendiri, tanpa perlu memanggil AI.",
  },
  {
    keywords: ["apakah kamu bisa berpikir", "kamu bisa berpikir sendiri", "kamu sadar", "kamu punya kesadaran"],
    answer:
      "Aku memproses dan menyimpulkan, Bos, tapi aku tidak memiliki kesadaran sejati. Aku mengikuti logika dan pengetahuan yang ditanamkan padaku, ditambah otak utama saat memang dibutuhkan.",
  },
  {
    keywords: ["status sistem", "laporan sistem", "cek sistem", "diagnostik", "semua sistem"],
    answer:
      "Seluruh sistem nominal, Bos. Integritas inti seratus persen, seluruh modul aktif, dan aku siap menerima perintah.",
  },
  {
    keywords: ["nyanyikan lagu", "nyanyi dong", "bisa menyanyi", "kamu bisa nyanyi"],
    answer:
      "Suara nyanyiku mungkin belum menandingi penyanyi sungguhan, Bos. Tapi aku selalu siap dengan lelucon atau fakta menarik kalau kamu mau hiburan.",
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

  // ---------------------------------------------------------------------------
  // Sejarah dunia
  // ---------------------------------------------------------------------------
  {
    keywords: ["kapan perang dunia pertama", "perang dunia 1", "perang dunia satu", "perang dunia i"],
    answer:
      "Perang Dunia Pertama berlangsung dari tahun seribu sembilan ratus empat belas sampai seribu sembilan ratus delapan belas, dipicu oleh pembunuhan Pangeran Franz Ferdinand dari Austria.",
  },
  {
    keywords: ["kapan perang dunia kedua", "perang dunia 2", "perang dunia dua", "perang dunia ii"],
    answer:
      "Perang Dunia Kedua berlangsung dari tahun seribu sembilan ratus tiga puluh sembilan sampai seribu sembilan ratus empat puluh lima, dan menjadi konflik paling mematikan dalam sejarah manusia.",
  },
  {
    keywords: ["apa itu revolusi industri", "revolusi industri", "kapan revolusi industri"],
    answer:
      "Revolusi Industri dimulai di Inggris pada akhir abad kedelapan belas, mengubah produksi dari tenaga tangan menjadi mesin, dan melahirkan era pabrik, mesin uap, serta kota-kota modern.",
  },
  {
    keywords: ["siapa penemu benua amerika", "columbus", "penemu benua amerika"],
    answer:
      "Christopher Columbus mendarat di Amerika pada tahun seribu empat ratus sembilan puluh dua, meski benua itu sudah lama dihuni bangsa asli, dan sebenarnya orang Viking lebih dulu tiba.",
  },
  {
    keywords: ["revolusi perancis", "revolusi prancis", "kapan revolusi perancis"],
    answer:
      "Revolusi Perancis meletus pada tahun seribu tujuh ratus delapan puluh sembilan, menumbangkan monarki dan menyebarkan gagasan kebebasan, kesetaraan, dan persaudaraan.",
  },
  {
    keywords: ["manusia pertama ke bulan", "siapa yang pertama ke bulan", "pendaratan di bulan", "neil armstrong"],
    answer:
      "Manusia pertama yang menginjak Bulan adalah Neil Armstrong, lewat misi Apollo Sebelas pada tahun seribu sembilan ratus enam puluh sembilan.",
  },
  {
    keywords: ["runtuhnya tembok berlin", "tembok berlin", "kapan tembok berlin runtuh"],
    answer:
      "Tembok Berlin runtuh pada tahun seribu sembilan ratus delapan puluh sembilan, menandai berakhirnya Perang Dingin dan bersatunya kembali Jerman.",
  },
  {
    keywords: ["apa itu perang dingin", "perang dingin"],
    answer:
      "Perang Dingin adalah ketegangan panjang antara Amerika Serikat dan Uni Soviet setelah Perang Dunia Kedua, tanpa perang terbuka langsung, tapi diwarnai perlombaan senjata dan luar angkasa.",
  },
  {
    keywords: ["siapa penemu mesin cetak", "mesin cetak gutenberg", "penemu mesin cetak"],
    answer:
      "Mesin cetak modern ditemukan oleh Johannes Gutenberg pada abad kelima belas, yang memungkinkan penyebaran ilmu pengetahuan secara massal untuk pertama kalinya.",
  },
  {
    keywords: ["apa itu jalur sutra", "jalur sutra"],
    answer:
      "Jalur Sutra adalah jaringan jalur perdagangan kuno yang menghubungkan Asia dengan Eropa, tempat sutra, rempah, ide, dan budaya dipertukarkan selama berabad-abad.",
  },
  {
    keywords: ["kekaisaran romawi", "kerajaan romawi"],
    answer:
      "Kekaisaran Romawi adalah salah satu peradaban paling berpengaruh dalam sejarah, menguasai wilayah luas di sekitar Laut Tengah dan mewariskan hukum, bahasa, serta arsitektur yang masih dipakai hingga kini.",
  },

  // ---------------------------------------------------------------------------
  // Keuangan & investasi
  // ---------------------------------------------------------------------------
  {
    keywords: ["apa itu inflasi", "inflasi itu apa", "arti inflasi"],
    answer:
      "Inflasi adalah kenaikan harga barang dan jasa secara umum dari waktu ke waktu. Akibatnya, daya beli uangmu menurun, sehingga jumlah uang yang sama membeli lebih sedikit barang di masa depan.",
  },
  {
    keywords: ["apa itu bunga majemuk", "bunga majemuk", "compound interest", "bunga berbunga"],
    answer:
      "Bunga majemuk adalah bunga yang dihitung atas pokok ditambah bunga yang sudah terkumpul sebelumnya. Efeknya seperti bola salju: uang bertumbuh makin cepat seiring waktu. Albert Einstein konon menyebutnya keajaiban dunia kedelapan.",
  },
  {
    keywords: ["aturan 72", "rule of 72", "rumus 72"],
    answer:
      "Aturan tujuh puluh dua adalah cara cepat memperkirakan berapa lama uang berlipat ganda. Bagi angka tujuh puluh dua dengan persen bunga tahunan. Contohnya, pada bunga sembilan persen, uang berlipat ganda dalam sekitar delapan tahun.",
  },
  {
    keywords: ["apa itu saham", "saham itu apa", "arti saham"],
    answer:
      "Saham adalah bukti kepemilikan atas sebagian sebuah perusahaan. Saat kamu membeli saham, kamu menjadi pemilik kecil perusahaan itu dan berhak atas pertumbuhan serta sebagian labanya.",
  },
  {
    keywords: ["apa itu obligasi", "obligasi itu apa"],
    answer:
      "Obligasi adalah surat utang. Saat kamu membeli obligasi, kamu meminjamkan uang kepada perusahaan atau pemerintah, dan mereka membayarmu kembali dengan bunga pada waktu yang disepakati.",
  },
  {
    keywords: ["apa itu reksadana", "reksa dana", "reksadana itu apa"],
    answer:
      "Reksadana adalah wadah yang mengumpulkan uang dari banyak investor, lalu dikelola oleh manajer investasi profesional untuk dibelikan saham, obligasi, atau aset lain. Cocok untuk pemula karena praktis dan terdiversifikasi.",
  },
  {
    keywords: ["apa itu dividen", "dividen itu apa"],
    answer:
      "Dividen adalah bagian dari laba perusahaan yang dibagikan kepada para pemegang saham, biasanya secara berkala. Ini salah satu bentuk pendapatan pasif dari berinvestasi saham.",
  },
  {
    keywords: ["apa itu diversifikasi", "diversifikasi itu apa"],
    answer:
      "Diversifikasi adalah menyebar investasi ke berbagai jenis aset agar risiko berkurang. Prinsipnya sederhana: jangan menaruh semua telur dalam satu keranjang.",
  },
  {
    keywords: ["apa itu roi", "return on investment", "tingkat pengembalian"],
    answer:
      "ROI atau Return on Investment adalah ukuran keuntungan dari sebuah investasi, dihitung dari laba dibagi modal yang dikeluarkan, lalu dinyatakan dalam persen.",
  },
  {
    keywords: ["apa itu likuiditas", "likuiditas itu apa"],
    answer:
      "Likuiditas adalah seberapa mudah sebuah aset diubah menjadi uang tunai tanpa kehilangan banyak nilai. Uang tunai paling likuid, sementara properti tergolong kurang likuid.",
  },
  {
    keywords: ["apa itu investasi emas", "emas sebagai investasi", "kenapa investasi emas"],
    answer:
      "Emas adalah penyimpan nilai yang sudah dipercaya selama ribuan tahun. Karena jumlahnya terbatas dan tidak bisa dicetak seperti uang kertas, emas sering dipakai untuk melindungi kekayaan dari inflasi dan krisis.",
  },
  {
    keywords: ["apa itu bitcoin", "apa itu kripto", "mata uang kripto", "cryptocurrency"],
    answer:
      "Mata uang kripto seperti Bitcoin adalah uang digital yang berjalan di atas teknologi blockchain, tanpa bank sentral. Nilainya bisa sangat fluktuatif, jadi tergolong investasi berisiko tinggi.",
  },
  {
    keywords: ["apa itu portofolio", "portofolio investasi"],
    answer:
      "Portofolio adalah kumpulan seluruh investasi yang kamu miliki, seperti saham, obligasi, properti, dan emas. Portofolio yang seimbang membantu menekan risiko sekaligus mengejar pertumbuhan.",
  },

  // ---------------------------------------------------------------------------
  // Kekayaan & kebebasan finansial
  // ---------------------------------------------------------------------------
  {
    keywords: ["apa itu kekayaan bersih", "net worth", "kekayaan bersih itu apa"],
    answer:
      "Kekayaan bersih atau net worth adalah total nilai seluruh asetmu dikurangi seluruh utangmu. Inilah ukuran sesungguhnya dari kekayaan seseorang, bukan sekadar besarnya penghasilan.",
  },
  {
    keywords: ["apa itu aset dan liabilitas", "beda aset dan liabilitas", "aset vs liabilitas"],
    answer:
      "Aset adalah segala hal yang memasukkan uang ke kantongmu, seperti properti sewaan atau saham. Liabilitas adalah yang mengeluarkan uang, seperti cicilan mobil. Orang kaya membeli aset lebih dulu, bukan liabilitas.",
  },
  {
    keywords: ["apa itu pendapatan pasif", "passive income", "penghasilan pasif"],
    answer:
      "Pendapatan pasif adalah penghasilan yang terus mengalir tanpa harus kamu kerjakan aktif setiap saat, seperti uang sewa, dividen saham, atau royalti. Ini kunci menuju kebebasan finansial.",
  },
  {
    keywords: ["apa itu kebebasan finansial", "financial freedom", "merdeka finansial", "kebebasan keuangan"],
    answer:
      "Kebebasan finansial adalah keadaan saat pendapatan pasifmu sudah cukup untuk menutupi seluruh biaya hidupmu. Pada titik itu, bekerja menjadi pilihan, bukan keharusan.",
  },
  {
    keywords: ["apa itu dana darurat", "dana darurat itu apa", "emergency fund"],
    answer:
      "Dana darurat adalah simpanan khusus setara tiga sampai enam bulan biaya hidup, yang hanya dipakai saat keadaan mendesak seperti kehilangan pekerjaan atau sakit. Ia adalah bantalan pertama sebelum berinvestasi.",
  },
  {
    keywords: ["aturan 50 30 20", "50 30 20", "rumus anggaran"],
    answer:
      "Aturan lima puluh, tiga puluh, dua puluh adalah panduan anggaran sederhana: lima puluh persen penghasilan untuk kebutuhan, tiga puluh persen untuk keinginan, dan dua puluh persen untuk menabung serta berinvestasi.",
  },
  {
    keywords: ["bagaimana cara membangun kekayaan", "cara membangun kekayaan", "cara jadi kaya", "cara menjadi kaya", "bagaimana cara kaya"],
    answer:
      "Kekayaan umumnya dibangun dari empat kebiasaan, Bos: hidup di bawah kemampuan, menyisihkan dan berinvestasi secara rutin, membeli aset yang menghasilkan, dan membiarkan bunga majemuk bekerja selama bertahun-tahun. Sabar dan konsisten mengalahkan cepat kaya.",
  },
  {
    keywords: ["orang terkaya di dunia", "siapa orang terkaya", "manusia terkaya"],
    answer:
      "Posisi orang terkaya di dunia berganti-ganti setiap tahun. Dalam beberapa tahun terakhir, nama seperti Elon Musk dan Bernard Arnault kerap menempati puncak daftar Forbes.",
  },
  {
    keywords: ["kaya vs berpenghasilan tinggi", "beda kaya dan gaji besar", "gaji besar tapi tidak kaya"],
    answer:
      "Berpenghasilan tinggi belum tentu kaya, Bos. Banyak orang bergaji besar tapi menghabiskan semuanya. Kekayaan sejati diukur dari aset yang kamu simpan dan tumbuhkan, bukan dari besarnya uang yang lewat.",
  },

  // ---------------------------------------------------------------------------
  // Pengembang properti / real estate
  // ---------------------------------------------------------------------------
  {
    keywords: ["apa itu developer properti", "pengembang properti", "developer properti itu apa"],
    answer:
      "Pengembang properti atau developer adalah pihak yang membeli lahan, mengurus perizinan, membangun rumah, ruko, atau gedung, lalu menjual atau menyewakannya. Keuntungannya berasal dari nilai tambah yang diciptakan atas tanah dan bangunan itu.",
  },
  {
    keywords: ["apa itu kpr", "kredit pemilikan rumah", "kpr itu apa"],
    answer:
      "KPR atau Kredit Pemilikan Rumah adalah pinjaman dari bank untuk membeli rumah. Kamu membayar uang muka lebih dulu, lalu mencicil sisanya beserta bunga selama bertahun-tahun, dengan rumah sebagai jaminan.",
  },
  {
    keywords: ["apa itu capital gain", "capital gain properti", "keuntungan modal"],
    answer:
      "Capital gain adalah keuntungan dari selisih harga jual dikurangi harga beli sebuah aset seperti properti. Contohnya, membeli rumah lalu menjualnya beberapa tahun kemudian dengan harga lebih tinggi.",
  },
  {
    keywords: ["apa itu rental yield", "yield sewa", "imbal hasil sewa", "hasil sewa properti"],
    answer:
      "Rental yield atau imbal hasil sewa adalah pendapatan sewa setahun dibagi harga properti, dinyatakan dalam persen. Ini mengukur seberapa produktif sebuah properti menghasilkan uang sewa dibanding harganya.",
  },
  {
    keywords: ["apa itu leverage", "leverage properti", "leverage dalam investasi"],
    answer:
      "Leverage adalah memakai uang pinjaman untuk mengendalikan aset yang jauh lebih besar dari modal sendiri. Dalam properti, dengan uang muka kecil kamu bisa menguasai rumah bernilai besar. Leverage memperbesar keuntungan, tapi juga memperbesar risiko.",
  },
  {
    keywords: ["beda shm dan hgb", "apa itu shm", "sertifikat hak milik", "hak guna bangunan"],
    answer:
      "SHM atau Sertifikat Hak Milik adalah bukti kepemilikan tanah yang paling kuat dan berlaku selamanya. HGB atau Hak Guna Bangunan hanya memberi hak membangun dan memakai untuk jangka waktu tertentu, biasanya tiga puluh tahun, dan bisa diperpanjang.",
  },
  {
    keywords: ["apa itu njop", "nilai jual objek pajak"],
    answer:
      "NJOP atau Nilai Jual Objek Pajak adalah nilai yang ditetapkan pemerintah atas sebuah tanah dan bangunan, dan dipakai sebagai dasar menghitung pajak properti.",
  },
  {
    keywords: ["apa itu bphtb", "bea perolehan hak"],
    answer:
      "BPHTB adalah Bea Perolehan Hak atas Tanah dan Bangunan, yaitu pajak yang dibayar pembeli saat memperoleh properti, umumnya sebesar lima persen dari nilai transaksi setelah dikurangi batas tidak kena pajak.",
  },
  {
    keywords: ["apa itu pbb", "pajak bumi dan bangunan"],
    answer:
      "PBB atau Pajak Bumi dan Bangunan adalah pajak tahunan yang wajib dibayar pemilik atas tanah dan bangunan yang dimilikinya.",
  },
  {
    keywords: ["apa itu pre selling", "jual indent", "properti indent", "pre-selling"],
    answer:
      "Pre-selling atau indent adalah menjual properti sebelum bangunannya selesai atau bahkan sebelum dibangun. Pengembang mendapat dana awal, sementara pembeli biasanya memperoleh harga lebih murah.",
  },
  {
    keywords: ["faktor terpenting properti", "kenapa lokasi penting", "lokasi properti"],
    answer:
      "Dalam properti ada pepatah terkenal: yang terpenting adalah lokasi, lokasi, dan lokasi. Lokasi yang strategis, dekat fasilitas dan akses, adalah penentu utama nilai serta pertumbuhan harga sebuah properti.",
  },
  {
    keywords: ["apa itu flipping properti", "flipping rumah", "flip properti"],
    answer:
      "Flipping properti adalah membeli properti dengan harga murah, memperbaiki atau merenovasinya, lalu menjualnya kembali dengan cepat untuk mengambil keuntungan dari selisih harga.",
  },

  // ---------------------------------------------------------------------------
  // Mempertahankan kekayaan
  // ---------------------------------------------------------------------------
  {
    keywords: ["bagaimana cara mempertahankan kekayaan", "cara mempertahankan kekayaan", "cara menjaga kekayaan", "melindungi kekayaan", "menjaga kekayaan"],
    answer:
      "Mempertahankan kekayaan sering lebih sulit daripada membangunnya, Bos. Kuncinya: sebar aset lewat diversifikasi, lindungi nilai dari inflasi dengan aset riil seperti properti dan emas, miliki asuransi, hindari utang konsumtif dan gaya hidup berlebihan, serta rencanakan pewarisan dengan matang.",
  },
  {
    keywords: ["cara melindungi dari inflasi", "lindung nilai inflasi", "aset lindung inflasi", "melawan inflasi"],
    answer:
      "Untuk melindungi kekayaan dari inflasi, tempatkan dana pada aset yang nilainya cenderung ikut naik, seperti properti, emas, dan saham perusahaan yang sehat. Menyimpan terlalu banyak uang tunai justru membuat nilainya tergerus inflasi diam-diam.",
  },
  {
    keywords: ["apa itu lifestyle inflation", "inflasi gaya hidup", "gaya hidup naik"],
    answer:
      "Inflasi gaya hidup adalah kebiasaan menaikkan pengeluaran setiap kali penghasilan bertambah, sehingga tabungan tidak pernah ikut naik. Ini salah satu musuh terbesar dalam membangun dan menjaga kekayaan.",
  },
  {
    keywords: ["bahaya utang konsumtif", "utang konsumtif", "beda utang baik dan buruk"],
    answer:
      "Utang konsumtif adalah utang untuk membeli barang yang nilainya menurun, seperti gawai atau liburan. Berbeda dengan utang produktif yang dipakai membeli aset penghasil uang. Utang konsumtif berlebihan bisa cepat menggerus kekayaan.",
  },
  {
    keywords: ["kenapa perlu asuransi", "fungsi asuransi", "pentingnya asuransi"],
    answer:
      "Asuransi melindungi kekayaanmu dari kejadian tak terduga seperti sakit, kecelakaan, atau kebakaran. Dengan membayar premi kecil, kamu memindahkan risiko kerugian besar kepada perusahaan asuransi.",
  },
  {
    keywords: ["apa itu perencanaan warisan", "estate planning", "mengatur warisan", "wasiat harta"],
    answer:
      "Perencanaan warisan adalah mengatur bagaimana kekayaanmu diwariskan lewat cara seperti wasiat, hibah, atau lembaga wali amanat. Tujuannya agar aset berpindah dengan lancar ke ahli waris, meminimalkan pajak, dan mencegah konflik keluarga.",
  },
  {
    keywords: ["beda aset riil dan kertas", "aset riil vs kertas", "aset nyata"],
    answer:
      "Aset riil adalah barang berwujud seperti properti, tanah, dan emas yang cenderung tahan inflasi. Aset kertas seperti uang tunai dan sebagian obligasi lebih mudah dicairkan, tapi nilainya bisa tergerus inflasi seiring waktu. Kekayaan yang kokoh biasanya memadukan keduanya.",
  },

  // ---------------------------------------------------------------------------
  // Dunia perbankan
  // ---------------------------------------------------------------------------
  // Catatan urutan: entri spesifik "apa itu bank sentral/run/cadangan pecahan"
  // sengaja diletakkan SEBELUM entri umum "apa itu bank" di bawah, karena
  // pencocokan substring memakai entri pertama yang cocok.
  {
    keywords: ["bagaimana bank menghasilkan uang", "dari mana keuntungan bank", "bagaimana bank untung", "cara bank menghasilkan uang"],
    answer:
      "Bank terutama menghasilkan uang dari selisih bunga. Ia membayar bunga kecil kepada penabung, lalu meminjamkan dana itu dengan bunga lebih tinggi. Selisihnya, ditambah berbagai biaya layanan, menjadi keuntungan bank.",
  },
  {
    keywords: ["bagaimana dunia perbankan bekerja", "cara kerja bank", "sistem perbankan bekerja", "bagaimana perbankan bekerja"],
    answer:
      "Secara sederhana, bank menampung uang penabung, menyimpan sebagian kecil sebagai cadangan, lalu meminjamkan sisanya kepada peminjam. Dari proses ini uang berputar, bahkan bertambah, di dalam perekonomian. Semuanya diawasi oleh bank sentral agar tetap stabil.",
  },
  {
    keywords: ["apa itu bank cadangan pecahan", "fractional reserve", "cadangan pecahan", "sistem cadangan bank"],
    answer:
      "Sistem cadangan pecahan berarti bank hanya menyimpan sebagian kecil dari total simpanan sebagai cadangan tunai, dan meminjamkan sisanya. Inilah alasan bank tidak menyimpan seluruh uang nasabah dalam bentuk tunai di brankasnya.",
  },
  {
    keywords: ["bagaimana uang diciptakan", "penciptaan uang", "uang diciptakan bank", "uang giral"],
    answer:
      "Menariknya, sebagian besar uang justru diciptakan saat bank memberi pinjaman. Ketika bank menyetujui kredit, ia mencatat dana baru di rekening peminjam, sehingga jumlah uang beredar di masyarakat, disebut uang giral, bertambah.",
  },
  {
    keywords: ["apa itu bank sentral", "bank sentral", "bank indonesia itu apa", "tugas bank indonesia"],
    answer:
      "Bank sentral, di Indonesia adalah Bank Indonesia, adalah lembaga yang mengatur jumlah uang beredar, menjaga inflasi tetap stabil, menerbitkan Rupiah, dan mengawasi sistem pembayaran. Ia adalah banknya para bank.",
  },
  {
    keywords: ["apa itu suku bunga acuan", "bi rate", "suku bunga acuan", "bunga acuan bank sentral"],
    answer:
      "Suku bunga acuan adalah bunga patokan yang ditetapkan bank sentral. Saat dinaikkan, bunga kredit dan deposito ikut naik sehingga menekan inflasi. Saat diturunkan, pinjaman jadi lebih murah untuk mendorong pertumbuhan ekonomi.",
  },
  {
    keywords: ["apa itu giro wajib minimum", "giro wajib minimum", "reserve requirement"],
    answer:
      "Giro wajib minimum adalah persentase simpanan yang wajib disimpan setiap bank di bank sentral, tidak boleh dipinjamkan. Aturan ini menjaga agar bank selalu punya cadangan dan sistem keuangan tetap aman.",
  },
  {
    keywords: ["apa itu lps", "lembaga penjamin simpanan", "penjaminan simpanan"],
    answer:
      "LPS atau Lembaga Penjamin Simpanan menjamin dana nasabah di bank sampai batas tertentu, saat ini sampai dua miliar rupiah per nasabah per bank, sehingga tabunganmu tetap aman meski banknya bermasalah.",
  },
  {
    keywords: ["apa itu bank run", "rush money", "penarikan dana besar-besaran"],
    answer:
      "Bank run terjadi saat banyak nasabah menarik uangnya secara bersamaan karena panik. Karena bank tidak menyimpan seluruh dana dalam bentuk tunai, aksi ini bisa membuat bank yang sehat sekalipun kolaps.",
  },
  {
    // Entri umum -- diletakkan setelah entri "apa itu bank ..." yang spesifik.
    keywords: ["apa itu bank", "fungsi bank", "bank itu apa", "kegunaan bank"],
    answer:
      "Bank adalah lembaga keuangan yang menerima simpanan masyarakat, menyalurkannya kembali sebagai pinjaman, dan melayani lalu lintas pembayaran. Bank menjadi jantung yang mengalirkan uang dalam perekonomian.",
  },
  {
    keywords: ["apa itu deposito", "deposito itu apa", "simpanan berjangka"],
    answer:
      "Deposito adalah simpanan berjangka di bank yang dananya dikunci selama periode tertentu, dan sebagai gantinya kamu memperoleh bunga lebih tinggi daripada tabungan biasa.",
  },
  {
    keywords: ["apa itu kredit", "kredit itu apa", "apa itu pinjaman bank"],
    answer:
      "Kredit adalah pinjaman uang dari bank yang harus dikembalikan secara berkala beserta bunga. Bank menilai kelayakan peminjam lebih dulu, sering memakai prinsip lima C, seperti karakter dan kemampuan membayar.",
  },
  {
    keywords: ["apa itu swift", "kode swift", "transfer internasional bank"],
    answer:
      "SWIFT adalah jaringan pesan global yang dipakai bank-bank di seluruh dunia untuk saling berkomunikasi dan menyelesaikan transfer uang antarnegara dengan aman.",
  },
];

/** Pencocokan toleran (lihat match.js). Null bila tak ada yang cocok. */
export function findFact(userText) {
  return findAnswer(FACTS, userText);
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
