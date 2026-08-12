// Chatbot Service - FAQ-based responses for the Bhumi Satya helpdesk
// TODO: Integrate AI service (OpenAI/Anthropic) di masa depan

const FAQ_RESPONSES = [
  {
    keywords: ["halo", "hai", "hello", "hi", "selamat"],
    response: "Halo! Selamat datang di Bhumi Satya - Digital Twin. Ada yang bisa saya bantu?",
    kategori: "greeting",
  },
  {
    keywords: ["bhumi satya", "bhumi", "apa ini", "tentang aplikasi"],
    response: "Bhumi Satya adalah sistem terpadu untuk mengelola data aset tanah organisasi. Data aset dikelola dalam satu pusat data dan digunakan untuk peta, verifikasi pertanahan, pelaporan, serta layanan penyewaan aset.",
    kategori: "fitur",
  },
  {
    keywords: ["login", "masuk", "akun", "password", "kata sandi"],
    response: "Untuk login ke Bhumi Satya, gunakan username dan password yang telah diberikan. Jika lupa password, hubungi administrator untuk reset akun. Akses ditentukan oleh peran kerja Anda, misalnya admin, pengelola aset, verifikator aset, viewer, atau masyarakat.",
    kategori: "akun",
  },
  {
    keywords: ["aset", "tanah", "bidang", "sertifikat"],
    response: "Bhumi Satya mengelola data aset tanah organisasi dalam satu master aset. Anda dapat melihat data aset, status sertifikat, lokasi bidang tanah, dan informasi lainnya melalui menu navigasi. Untuk pertanyaan spesifik, hubungi pengelola aset atau administrator Bhumi Satya.",
    kategori: "aset",
  },
  {
    keywords: ["peta", "map", "lokasi", "gis"],
    response: "Fitur peta menampilkan visualisasi geografis aset tanah. Anda dapat melihat bidang tanah, batas wilayah, dan layer lainnya. Gunakan kontrol layer untuk menampilkan/menyembunyikan informasi yang dibutuhkan.",
    kategori: "peta",
  },
  {
    keywords: ["sewa", "rental", "peminjaman"],
    response: "Untuk informasi penyewaan aset, Anda dapat melihat daftar aset yang tersedia di menu 'Aset Tersedia'. Proses penyewaan memerlukan persetujuan dari petugas yang berwenang. Silakan ajukan permintaan melalui form yang tersedia.",
    kategori: "sewa",
  },
  {
    keywords: ["notifikasi", "notification", "pemberitahuan"],
    response: "Notifikasi akan muncul di pojok kanan atas untuk memberitahu Anda tentang aktivitas terbaru seperti status aset, permintaan sewa, dan informasi penting lainnya. Anda dapat menandai semua sebagai sudah dibaca.",
    kategori: "notifikasi",
  },
  {
    keywords: ["laporan", "report", "export", "download"],
    response: "Anda dapat mengunduh laporan dalam format PDF atau Excel dari berbagai halaman. Cari tombol 'Download' atau 'Export' di halaman yang ingin Anda laporkan.",
    kategori: "laporan",
  },
  {
    keywords: ["kontak", "hubungi", "contact", "admin"],
    response: "Untuk bantuan lebih lanjut, silakan hubungi administrator Bhumi Satya melalui admin@bhumisatya.com. Jam operasional: Senin-Jumat, 08:00-16:00 WIB.",
    kategori: "kontak",
  },
  {
    keywords: ["error", "masalah", "problem", "bug", "tidak bisa"],
    response: "Mohon maaf atas ketidaknyamanannya. Jika Anda mengalami masalah teknis, silakan:\n1. Muat ulang halaman\n2. Pastikan koneksi internet stabil\n3. Hubungi administrator jika masalah berlanjut",
    kategori: "support",
  },
  {
    keywords: ["fitur", "feature", "fungsi", "cara pakai", "panduan"],
    response: "Bhumi Satya menyediakan fitur:\n- Manajemen data aset tanah\n- Visualisasi peta interaktif\n- Sistem penyewaan aset\n- Riwayat aktivitas\n- Laporan dan ekspor data\n\nUntuk panduan penggunaan, silakan hubungi admin atau lihat dokumentasi yang tersedia.",
    kategori: "fitur",
  },
  {
    keywords: ["terima kasih", "thanks", "makasih"],
    response: "Sama-sama! Senang bisa membantu. Jika ada pertanyaan lain, jangan ragu untuk bertanya lagi. 😊",
    kategori: "closing",
  },
  {
    keywords: ["bantuan", "help", "bantu"],
    response: "Saya siap membantu! Anda bisa bertanya tentang:\n- Cara login dan manajemen akun\n- Informasi aset dan sertifikat\n- Fitur peta dan visualisasi\n- Proses penyewaan aset\n- Laporan dan ekspor data\n- Kontak admin\n\nAtau ajukan pertanyaan spesifik yang Anda butuhkan.",
    kategori: "help",
  },
];

// Default response jika tidak ada match
const DEFAULT_RESPONSE = {
  response: "Maaf, saya belum memahami pertanyaan tersebut. Coba tanyakan dengan kata kunci yang lebih singkat, misalnya login, aset, peta, sewa, laporan, atau kontak admin.",
  kategori: "default",
};

class ChatbotService {
  /**
   * Find best matching response based on user message
   * @param {string} message - User's message
   * @returns {object} - Response object with jawaban and kategori
   */
  findResponse(message) {
    const lowerMessage = message.toLowerCase().trim();

    // Check each FAQ response
    for (const faq of FAQ_RESPONSES) {
      const hasKeyword = faq.keywords.some((keyword) =>
        lowerMessage.includes(keyword)
      );

      if (hasKeyword) {
        return {
          jawaban: faq.response,
          kategori: faq.kategori,
        };
      }
    }

    // Return default response if no match
    return {
      jawaban: DEFAULT_RESPONSE.response,
      kategori: DEFAULT_RESPONSE.kategori,
    };
  }

  /**
   * Get suggested questions for quick access
   * @returns {array} - List of suggested questions
   */
  getSuggestedQuestions() {
    return [
      "Cara login ke Bhumi Satya?",
      "Bagaimana melihat data aset?",
      "Cara menggunakan peta?",
      "Bagaimana proses sewa aset?",
      "Cara download laporan?",
      "Kontak admin",
    ];
  }

  /**
   * Get quick reply options based on current context
   * @param {string} kategori - Current conversation kategori
   * @returns {array} - List of quick reply buttons
   */
  getQuickReplies(kategori) {
    const quickReplies = {
      greeting: [
        "Apa itu Bhumi Satya?",
        "Cara login",
        "Lihat fitur",
      ],
      akun: [
        "Lupa password",
        "Cara daftar",
        "Hubungi admin",
      ],
      aset: [
        "Lihat daftar aset",
        "Status sertifikat",
        "Cari aset tertentu",
      ],
      peta: [
        "Layer yang tersedia",
        "Cara zoom peta",
        "Lihat batas wilayah",
      ],
      sewa: [
        "Aset tersedia",
        "Cara mengajukan sewa",
        "Status permintaan",
      ],
      default: [
        "Fitur Bhumi Satya",
        "Cara pakai",
        "Hubungi admin",
      ],
    };

    return quickReplies[kategori] || quickReplies.default;
  }
}

export default new ChatbotService();
