// Pengetahuan bisnis Loonars -- pengelolaan (manajemen) villa, rumah kos,
// homestay, dan F&B, model perusahaan pengelola tanpa aset (asset-light),
// sampai jalan menuju IPO. Ditanamkan langsung supaya Ultron paham betul bisnis
// tempatnya bekerja dan bisa menjawabnya secara lokal, tanpa panggilan AI.
//
// Dicek di brain.js bersama basis pengetahuan lokal lain, sebelum otak utama
// MK Connect. Kata kunci berupa frasa spesifik domain hospitality/keuangan
// sehingga tidak bentrok dengan pertanyaan data operasional MK Connect.
//
// Catatan: angka (persentase/rentang) bersifat rujukan industri umum, bukan
// angka internal Loonars. Untuk data internal yang berubah-ubah, Ultron tetap
// meneruskannya ke otak utama.

export const LOONARS_KNOWLEDGE = [
  // ---------------------------------------------------------------------------
  // Loonars & model asset-light
  // ---------------------------------------------------------------------------
  {
    keywords: ["apa itu loonars", "loonars itu apa", "tentang loonars", "perusahaan loonars"],
    answer:
      "Loonars adalah perusahaan pengelola di bidang hospitality dan properti dengan model asset-light. Loonars mengelola villa, rumah kos, homestay, dan usaha makanan dan minuman milik mitra dan pemilik, tanpa harus memiliki asetnya sendiri, dan memperoleh pendapatan dari jasa pengelolaan.",
  },
  {
    keywords: ["apa yang dikelola loonars", "bisnis loonars", "lini bisnis loonars", "loonars mengelola apa"],
    answer:
      "Loonars mengelola empat lini utama, Bos: villa untuk sewa menginap, rumah kos untuk sewa bulanan, homestay berbasis pengalaman lokal, dan usaha makanan dan minuman. Semuanya dijalankan dengan standar operasional yang seragam di bawah satu merek pengelola.",
  },
  {
    keywords: ["apa itu asset light", "asset-light", "model tanpa aset", "perusahaan pengelola tanpa aset", "perusahaan tanpa aset", "manajemen tanpa aset"],
    answer:
      "Model asset-light atau tanpa aset berarti perusahaan tumbuh dengan mengelola dan memberi merek pada aset milik pihak lain, bukan membelinya. Pemilik dan investor menanggung tanah serta bangunan, sementara pengelola menyediakan sistem, operasional, pemasaran, dan standar layanan, lalu mendapat imbalan berupa fee.",
  },
  {
    keywords: ["bagaimana loonars menghasilkan uang", "sumber pendapatan loonars", "pendapatan perusahaan pengelola", "dari mana untung pengelola", "model pendapatan pengelola"],
    answer:
      "Perusahaan pengelola seperti Loonars memperoleh pendapatan dari beberapa sumber: management fee, yaitu persentase dari pendapatan aset kelolaan, skema bagi hasil dengan pemilik, biaya waralaba atau lisensi merek, serta biaya layanan tambahan. Semuanya berulang dan tumbuh seiring bertambahnya unit kelolaan.",
  },
  {
    keywords: ["keunggulan asset light", "kelebihan model tanpa aset", "kenapa asset light", "manfaat asset light"],
    answer:
      "Keunggulan model tanpa aset adalah skalabilitas tinggi dan modal awal ringan. Karena tidak perlu membeli properti, perusahaan bisa menambah banyak unit kelolaan dengan cepat, marginnya cenderung tinggi, dan risiko kepemilikan aset ditanggung oleh pemilik, bukan pengelola.",
  },
  {
    keywords: ["risiko asset light", "kelemahan model tanpa aset", "risiko perusahaan pengelola"],
    answer:
      "Risiko utama model tanpa aset adalah ketergantungan pada kualitas aset mitra, pada isi kontrak pengelolaan, dan pada reputasi merek. Jika okupansi rendah atau mitra menarik asetnya, pendapatan bisa terganggu. Karena itu standar layanan dan hubungan dengan pemilik harus dijaga ketat.",
  },
  {
    keywords: ["jenis kontrak pengelolaan", "management contract", "beda lease dan waralaba", "kontrak operator properti"],
    answer:
      "Ada beberapa bentuk kontrak pengelolaan: kontrak manajemen, di mana operator menjalankan aset dan menerima fee; sewa atau lease, di mana operator menyewa aset lalu mengambil selisih pendapatan; waralaba, di mana pemilik memakai merek dan sistem operator dengan membayar biaya; serta bagi hasil, di mana keuntungan dibagi sesuai kesepakatan.",
  },
  {
    keywords: ["contoh perusahaan asset light", "contoh perusahaan pengelola", "perusahaan hospitality tanpa aset"],
    answer:
      "Contoh perusahaan hospitality asset-light yang sukses antara lain Marriott, yang sekitar tujuh puluh tujuh persen propertinya diwaralabakan atau dilisensikan, lalu OYO dan RedDoorz yang menstandarkan ribuan hotel kecil, serta Airbnb sebagai platform. Semuanya tumbuh besar tanpa memiliki mayoritas bangunannya.",
  },
  {
    keywords: ["beda pengelola dan pemilik", "beda operator dan investor", "beda pengelola dan investor"],
    answer:
      "Pemilik atau investor menyediakan modal dan menanggung aset serta belanja modalnya. Pengelola atau operator menjalankan operasional harian, pemasaran, dan layanan, lalu memperoleh fee atas jasanya. Loonars berperan sebagai pengelola, bukan pemilik aset.",
  },

  // ---------------------------------------------------------------------------
  // Pengelolaan villa
  // ---------------------------------------------------------------------------
  {
    keywords: ["pengelolaan villa", "manajemen villa", "cara mengelola villa", "bisnis villa sewa", "kelola villa"],
    answer:
      "Pengelolaan villa mencakup memasarkan villa untuk sewa menginap, mengatur harga, melayani tamu dari check-in sampai check-out, serta merawat kebersihan dan kondisi properti. Tujuannya memaksimalkan pendapatan pemilik sekaligus menjaga pengalaman tamu tetap prima.",
  },
  {
    keywords: ["channel villa", "ota villa", "platform sewa villa", "airbnb booking agoda", "channel manager"],
    answer:
      "Villa umumnya dipasarkan lewat kanal daring seperti Airbnb, Booking.com, dan Agoda, ditambah pemesanan langsung. Agar tidak terjadi tabrakan jadwal, semua kanal disatukan lewat channel manager sehingga ketersediaan dan harga selalu sinkron.",
  },
  {
    keywords: ["revenue management villa", "dynamic pricing", "harga dinamis villa", "atur harga villa", "penetapan harga menginap"],
    answer:
      "Revenue management adalah seni menetapkan harga yang tepat pada waktu yang tepat. Harga villa dinaikkan saat permintaan tinggi seperti akhir pekan dan musim liburan, lalu diturunkan saat sepi, agar pendapatan per malam tersedia semaksimal mungkin.",
  },
  {
    keywords: ["operasional villa", "housekeeping villa", "sop villa", "layanan tamu villa"],
    answer:
      "Operasional villa yang baik meliputi kebersihan dan tata graha yang konsisten, perawatan berkala, proses check-in dan check-out yang mulus, penanganan keluhan tamu dengan cepat, dan menjaga ulasan tetap tinggi. Ulasan positif adalah bahan bakar utama pemesanan berikutnya.",
  },
  {
    keywords: ["management fee villa", "fee pengelolaan villa", "biaya jasa kelola villa", "berapa fee villa"],
    answer:
      "Fee pengelolaan villa umumnya berkisar sepuluh sampai tiga puluh persen dari pendapatan, tergantung seberapa lengkap layanannya. Semakin lengkap, mulai dari pemasaran, operasional, sampai keuangan, semakin besar porsi fee-nya.",
  },
  {
    keywords: ["perizinan villa", "izin usaha villa", "legalitas villa", "pajak villa"],
    answer:
      "Villa yang disewakan sebaiknya memiliki izin usaha lewat Nomor Induk Berusaha, izin usaha pariwisata atau pondok wisata sesuai daerahnya, dan taat pada pajak daerah atas jasa penginapan yang umumnya sekitar sepuluh persen.",
  },

  // ---------------------------------------------------------------------------
  // Pengelolaan rumah kos
  // ---------------------------------------------------------------------------
  {
    keywords: ["pengelolaan kos", "manajemen kos", "jasa manajemen kost", "cara mengelola kos", "kelola rumah kos", "bisnis kos"],
    answer:
      "Pengelolaan rumah kos adalah layanan menjalankan seluruh operasional kos untuk pemilik: memasarkan kamar, menyeleksi penghuni, menagih dan mencatat pembayaran, menjaga kebersihan dan keamanan, merawat bangunan, sampai menyusun laporan keuangan. Pemilik untung tanpa harus repot mengurus sehari-hari.",
  },
  {
    keywords: ["model bisnis kos", "jenis kos", "kos eksklusif", "coliving", "kos putra putri"],
    answer:
      "Kos disewakan bulanan dan terbagi beberapa jenis: kos putra, putri, atau campur, serta kos eksklusif dan coliving dengan fasilitas lebih lengkap seperti WiFi, laundry, dapur bersama, dan keamanan. Segmen menentukan tarif dan target penghuninya.",
  },
  {
    keywords: ["bagi hasil kos", "revenue share kos", "skema kerja sama kos", "kerja sama pemilik kos"],
    answer:
      "Dalam skema bagi hasil, pengelola menjalankan kos milik orang lain lalu membagi keuntungan sesuai kesepakatan, misalnya operator mendapat porsi tertentu dari pendapatan sebagai imbalan jasa. Pemilik memperoleh penghasilan pasif tanpa mengurus operasional.",
  },
  {
    keywords: ["okupansi kos", "hitung pendapatan kos", "noi kos", "pendapatan bersih kos"],
    answer:
      "Pendapatan kos dihitung dari tarif per kamar dikalikan jumlah kamar dan tingkat okupansi, lalu dikurangi biaya operasional untuk mendapat pendapatan operasional bersih atau NOI. Menjaga okupansi tinggi dan biaya efisien adalah kunci profitabilitas.",
  },
  {
    keywords: ["roi kos", "balik modal kos", "payback kos", "keuntungan bisnis kos"],
    answer:
      "ROI kos dihitung dari laba bersih setahun dibagi total investasi awal, dikali seratus persen. Waktu balik modal bisnis kos umumnya berkisar enam sampai sepuluh tahun, sangat bergantung pada lokasi, tingkat okupansi, dan pengendalian biaya.",
  },
  {
    keywords: ["perizinan kos", "izin pondokan", "izin usaha kos", "legalitas kos"],
    answer:
      "Kos sebaiknya mengurus Nomor Induk Berusaha dan Persetujuan Bangunan Gedung. Di banyak daerah, kos dengan jumlah kamar tertentu, sering sepuluh kamar atau lebih, wajib memiliki izin usaha pondokan dan membayar pajak kos sesuai aturan daerah.",
  },
  {
    keywords: ["digitalisasi kos", "aplikasi manajemen kos", "smart lock kos", "pembayaran otomatis kos"],
    answer:
      "Digitalisasi membuat pengelolaan kos jauh lebih efisien: aplikasi manajemen untuk memantau kamar dan tagihan, pembayaran otomatis agar tidak ada tunggakan, serta kunci pintar untuk akses tanpa kunci fisik. Semua ini menekan biaya dan meningkatkan pengalaman penghuni.",
  },

  // ---------------------------------------------------------------------------
  // Pengelolaan homestay
  // ---------------------------------------------------------------------------
  {
    keywords: ["apa itu homestay", "pengelolaan homestay", "manajemen homestay", "kelola homestay", "beda homestay dan villa", "beda homestay dan hotel"],
    answer:
      "Homestay adalah rumah tinggal yang sebagian kamarnya disewakan, sering dengan tuan rumah yang ikut tinggal, sehingga tamu merasakan pengalaman hidup lokal. Berbeda dari hotel yang formal atau villa yang privat, daya tarik utama homestay adalah keramahan dan kedekatan dengan budaya setempat.",
  },
  {
    keywords: ["standar homestay", "standar usaha pondok wisata", "regulasi homestay", "aturan homestay"],
    answer:
      "Di Indonesia, homestay atau pondok wisata diatur lewat Standar Usaha Pondok Wisata dari Kementerian Pariwisata. Standar ini mengatur aspek produk, pelayanan, dan pengelolaan, agar homestay tetap layak, aman, dan nyaman meski bersifat sederhana dan berbasis rumah.",
  },
  {
    keywords: ["apa itu sapta pesona", "sapta pesona", "tujuh unsur pariwisata"],
    answer:
      "Sapta Pesona adalah tujuh unsur yang harus dijaga di destinasi wisata: aman, tertib, bersih, sejuk, indah, ramah, dan kenangan. Bagi pengelola homestay, Sapta Pesona adalah pedoman menciptakan pengalaman tamu yang berkesan sehingga mereka datang kembali dan merekomendasikan.",
  },
  {
    keywords: ["apa itu chse", "chse pariwisata", "cleanliness health safety"],
    answer:
      "CHSE adalah standar Kebersihan, Kesehatan, Keselamatan, dan Kelestarian Lingkungan yang didorong Kementerian Pariwisata. Menerapkan CHSE membuat homestay dan penginapan lebih dipercaya tamu, terutama untuk urusan higiene dan keamanan.",
  },
  {
    keywords: ["pokdarwis", "desa wisata", "homestay berbasis masyarakat"],
    answer:
      "Homestay sering dikelola bersama masyarakat lewat Kelompok Sadar Wisata atau Pokdarwis di desa wisata. Modelnya memberdayakan warga sebagai tuan rumah, membagi manfaat ekonomi ke komunitas, sambil menjaga keaslian budaya dan lingkungan setempat.",
  },

  // ---------------------------------------------------------------------------
  // Pengelolaan F&B (makanan & minuman)
  // ---------------------------------------------------------------------------
  {
    keywords: ["manajemen f&b", "manajemen fnb", "pengelolaan f&b", "pengelolaan fnb", "manajemen restoran", "kelola restoran", "kelola cafe"],
    answer:
      "Manajemen F&B adalah mengelola seluruh operasional usaha makanan dan minuman: menyusun menu, menjalankan dapur, melayani pelanggan, mengendalikan biaya bahan dan tenaga kerja, serta menjaga higiene. Sukses F&B ada pada keseimbangan antara rasa, layanan, dan disiplin biaya.",
  },
  {
    keywords: ["apa itu food cost", "food cost", "biaya bahan makanan", "persentase food cost", "hpp makanan"],
    answer:
      "Food cost adalah biaya bahan baku dibandingkan penjualan, dihitung dari harga pokok penjualan dibagi total penjualan makanan dikali seratus persen. Standar sehat industri berkisar dua puluh delapan sampai tiga puluh lima persen. Jika naik terus, biasanya ada masalah harga bahan, porsi, atau pemborosan.",
  },
  {
    keywords: ["apa itu prime cost", "prime cost", "biaya utama restoran"],
    answer:
      "Prime cost adalah gabungan biaya bahan baku dan biaya tenaga kerja. Idealnya prime cost dijaga di sekitar enam puluh persen dari penjualan atau kurang. Ini indikator paling penting kesehatan keuangan sebuah usaha makanan dan minuman.",
  },
  {
    keywords: ["menu engineering", "rekayasa menu", "analisis menu", "menu bintang"],
    answer:
      "Menu engineering adalah menganalisis setiap item menu berdasarkan popularitas dan marginnya, lalu menggolongkannya menjadi bintang, kuda pekerja, teka-teki, dan anjing. Tujuannya menonjolkan menu untung tinggi yang laku, memperbaiki yang kurang, dan menyingkirkan yang merugikan.",
  },
  {
    keywords: ["pengendalian biaya f&b", "kurangi food cost", "kontrol biaya restoran", "tekan biaya makanan"],
    answer:
      "Biaya F&B ditekan dengan porsi yang distandarkan lewat resep baku, mengurangi limbah, menerapkan rotasi stok pertama masuk pertama keluar, bernegosiasi dengan beberapa pemasok, dan mengelola persediaan agar tidak busuk. Selisih antara biaya teoritis dan aktual harus terus dipantau.",
  },
  {
    keywords: ["metrik restoran", "kpi f&b", "average check", "table turnover", "perputaran meja"],
    answer:
      "Metrik penting F&B antara lain rata-rata belanja per pelanggan atau average check, perputaran meja yang mengukur berapa kali satu meja terisi dalam sehari, food cost, dan prime cost. Bersama-sama, metrik ini menunjukkan seberapa produktif dan sehat usaha itu.",
  },
  {
    keywords: ["perizinan f&b", "izin usaha restoran", "sertifikat halal", "laik higiene sanitasi", "legalitas restoran"],
    answer:
      "Usaha makanan dan minuman perlu Nomor Induk Berusaha, Sertifikat Laik Higiene Sanitasi, dan sertifikat halal yang kini wajib untuk banyak produk. Selain itu ada pajak daerah atas makanan dan minuman yang umumnya sepuluh persen dari nilai transaksi.",
  },
  {
    keywords: ["apa itu cloud kitchen", "cloud kitchen", "dapur hantu", "ghost kitchen"],
    answer:
      "Cloud kitchen atau dapur hantu adalah dapur yang hanya melayani pesan-antar tanpa ruang makan. Karena tidak butuh tempat mahal di lokasi ramai, modelnya hemat modal dan cocok dengan pendekatan asset-light untuk memperbanyak merek makanan dengan cepat.",
  },

  // ---------------------------------------------------------------------------
  // Metrik pengelolaan hospitality
  // ---------------------------------------------------------------------------
  {
    keywords: ["apa itu okupansi", "tingkat okupansi", "occupancy rate", "hitung okupansi"],
    answer:
      "Okupansi atau tingkat hunian adalah persentase malam yang terisi dibanding malam yang tersedia. Rumusnya jumlah malam terjual dibagi jumlah malam tersedia dikali seratus persen. Ini ukuran seberapa penuh sebuah properti.",
  },
  {
    keywords: ["apa itu adr", "average daily rate", "tarif harian rata-rata"],
    answer:
      "ADR atau Average Daily Rate adalah tarif harian rata-rata, yaitu total pendapatan kamar dibagi jumlah malam yang terjual. ADR menunjukkan seberapa mahal rata-rata satu malam terjual.",
  },
  {
    keywords: ["apa itu revpar", "revpar", "revenue per available room", "pendapatan per kamar tersedia"],
    answer:
      "RevPAR atau Revenue per Available Room adalah pendapatan per kamar tersedia, dihitung dari ADR dikali okupansi, atau total pendapatan dibagi malam tersedia. RevPAR adalah metrik paling menyeluruh karena menggabungkan harga dan tingkat hunian sekaligus.",
  },
  {
    keywords: ["apa itu noi", "net operating income", "pendapatan operasional bersih"],
    answer:
      "NOI atau Net Operating Income adalah pendapatan operasional bersih, yaitu seluruh pendapatan dikurangi seluruh biaya operasional, sebelum cicilan dan pajak. NOI menunjukkan seberapa untung sebuah aset dari operasinya sendiri.",
  },

  // ---------------------------------------------------------------------------
  // Jalan menuju IPO
  // ---------------------------------------------------------------------------
  {
    keywords: ["apa itu ipo", "ipo itu apa", "go public", "penawaran umum perdana"],
    answer:
      "IPO atau Initial Public Offering adalah saat sebuah perusahaan menawarkan sahamnya kepada publik untuk pertama kali, lalu sahamnya tercatat dan diperdagangkan di Bursa Efek Indonesia. Lewat IPO, perusahaan menghimpun modal dari masyarakat luas.",
  },
  {
    keywords: ["tahapan ipo", "proses ipo", "langkah ipo", "cara ipo", "tahap go public"],
    answer:
      "Proses IPO di Indonesia umumnya tiga sampai enam bulan, melalui beberapa tahap: persiapan internal dan penunjukan penjamin emisi serta profesi penunjang; uji tuntas dan penyusunan dokumen; pengajuan pernyataan pendaftaran ke OJK serta permohonan ke Bursa; penawaran awal atau bookbuilding lewat roadshow; pernyataan efektif dari OJK; lalu penawaran umum dan pencatatan saham di bursa.",
  },
  {
    keywords: ["profesi penunjang ipo", "underwriter", "penjamin emisi", "siapa saja terlibat ipo"],
    answer:
      "IPO melibatkan sejumlah pihak: penjamin emisi atau underwriter yang mengatur dan menjamin penjualan saham, akuntan publik yang mengaudit keuangan, konsultan hukum yang memberi opini hukum, notaris, penilai independen untuk menaksir aset, dan biro administrasi efek. Merekalah tim yang mengantar perusahaan ke bursa.",
  },
  {
    keywords: ["syarat ipo", "syarat go public", "persyaratan pencatatan saham", "papan utama", "papan pengembangan", "papan akselerasi", "free float"],
    answer:
      "Untuk melantai di bursa, perusahaan harus memenuhi tata kelola yang baik, laporan keuangan teraudit, ambang aset atau kapitalisasi tertentu sesuai papan pencatatannya, dan melepas saham ke publik. Ada Papan Utama untuk perusahaan mapan dengan laba positif, Papan Pengembangan, dan Papan Akselerasi untuk usaha yang lebih kecil. Porsi saham publik minimal sekitar lima belas persen.",
  },
  {
    keywords: ["apa itu prospektus", "prospektus ipo", "dokumen ipo"],
    answer:
      "Prospektus adalah dokumen resmi yang wajib diterbitkan saat IPO. Isinya seluruh fakta material tentang perusahaan: kegiatan usaha, laporan keuangan teraudit, risiko, dan rencana penggunaan dana. Prospektus menjadi dasar calon investor menilai perusahaan sebelum membeli sahamnya.",
  },
  {
    keywords: ["bagaimana perusahaan pengelola ipo", "cara loonars ipo", "asset light bisa ipo", "ipo perusahaan pengelola", "ipo tanpa aset", "loonars go public"],
    answer:
      "Perusahaan pengelola tanpa aset seperti Loonars bisa IPO karena nilainya bertumpu pada pendapatan fee yang berulang, pertumbuhan jumlah unit kelolaan, kekuatan merek, dan laba, bukan pada aset fisik. Justru model yang ringan modal ini menarik bagi investor karena mudah diperbesar. Kuncinya: laporan keuangan teraudit rapi selama beberapa tahun, tata kelola perusahaan yang kuat, dan rekam jejak pertumbuhan yang konsisten.",
  },
  {
    keywords: ["persiapan loonars ipo", "persiapan menuju ipo", "langkah menuju ipo", "cara mempersiapkan ipo"],
    answer:
      "Menuju IPO, langkahnya berurutan, Bos: rapikan legalitas dan susun laporan keuangan yang teraudit; terapkan tata kelola yang baik lengkap dengan direksi dan komisaris independen; bangun rekam jejak pertumbuhan unit kelolaan dan profitabilitas; tunjuk penjamin emisi serta profesi penunjang; susun prospektus; ajukan pernyataan pendaftaran ke OJK; lakukan penawaran umum; lalu resmi tercatat di Bursa Efek Indonesia.",
  },
  {
    keywords: ["manfaat ipo", "keuntungan go public", "kenapa perusahaan ipo", "tujuan ipo"],
    answer:
      "IPO memberi perusahaan modal segar untuk ekspansi, meningkatkan kredibilitas dan pamor merek, memberi likuiditas bagi pemegang saham awal, serta membuka peluang memakai saham sebagai alat akuisisi. Bagi perusahaan pengelola yang ingin cepat memperbanyak unit kelolaan, modal dari IPO bisa menjadi bahan bakar pertumbuhan.",
  },
];

/** Substring match sederhana terhadap teks pengguna (huruf kecil). Null bila tak ada yang cocok. */
export function findLoonars(userText) {
  const text = userText.toLowerCase();
  for (const entry of LOONARS_KNOWLEDGE) {
    if (entry.keywords.some((keyword) => text.includes(keyword))) {
      return entry.answer;
    }
  }
  return null;
}
