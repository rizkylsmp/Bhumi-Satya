import sequelize from "../src/config/database.js";
import Aset from "../src/models/Aset.js";
import User from "../src/models/User.js";

sequelize.options.logging = false;

const names = [
  ["Tanah Kantor Pelayanan", "Badan Pendapatan Daerah", "Purworejo"],
  ["Gedung Pelayanan Terpadu", "Pemerintah Kota Pasuruan", "Bugul Kidul"],
  ["Tanah Fasilitas Pendidikan", "Dinas Pendidikan", "Gadingrejo"],
  ["Gedung Pusat Kesehatan", "Dinas Kesehatan", "Panggungrejo"],
  ["Tanah Ruang Terbuka Hijau", "Dinas Lingkungan Hidup", "Purworejo"],
  ["Gedung Balai Pertemuan", "Kecamatan Bugul Kidul", "Bugul Kidul"],
  ["Tanah Sarana Olahraga", "Dinas Pemuda dan Olahraga", "Gadingrejo"],
  ["Gedung Perpustakaan Daerah", "Dinas Perpustakaan", "Panggungrejo"],
  ["Tanah Gudang Logistik", "Badan Penanggulangan Bencana", "Purworejo"],
  ["Gedung Sentra UMKM", "Dinas Perindustrian dan Perdagangan", "Bugul Kidul"],
];

const samples = names.map(([assetName, taxpayerName, district], index) => {
  const number = index + 1;
  const landValue = 850000 + index * 125000;
  const buildingValue = 1200000 + index * 175000;
  const bapendaLandArea = 680 + index * 87;
  const bapendaBuildingArea = 240 + index * 42;
  const mappedLandArea = bapendaLandArea + 4.5 + index * 0.75;
  const mappedBuildingArea = bapendaBuildingArea + 2.25 + index * 0.5;

  return {
    kode_aset: `PAJAK-SAMPLE-${String(number).padStart(2, "0")}`,
    nama_aset: assetName,
    lokasi: `Jl. Bhumi Satya No. ${number}, Kecamatan ${district}, Kota Pasuruan`,
    koordinat_lat: -7.645 + index * 0.0021,
    koordinat_long: 112.905 + index * 0.0023,
    luas: mappedLandArea,
    status: "Aktif",
    jenis_aset: number % 2 === 0 ? "Gedung dan Bangunan" : "Tanah",
    sumber: "BPKA",
    nilai_aset:
      landValue * mappedLandArea + buildingValue * mappedBuildingArea,
    tahun_perolehan: 2014 + index,
    nomor_sertifikat: `HP-${String(201 + index).padStart(4, "0")}/KOTA-PAS`,
    status_sertifikat: "Telah Bersertifikat",
    keterangan: `Data sampel pajak Bhumi Satya nomor ${number}`,
    jenis_hak: "HAK PAKAI",
    atas_nama: "Pemerintah Kota Pasuruan",
    kecamatan: district,
    desa_kelurahan: `Kelurahan Sampel ${number}`,
    luas_lapangan: mappedLandArea,
    penggunaan_saat_ini: assetName,
    pajak_fid: 1000 + number,
    pajak_status: "Terverifikasi",
    nop: `35.75.${String(10 + index).padStart(3, "0")}.${String(
      100 + number,
    ).padStart(4, "0")}.${String(number).padStart(3, "0")}-${index}`,
    nama_wajib_pajak: taxpayerName,
    nilai_bumi_per_m2: landValue,
    nilai_bangunan_per_m2: buildingValue,
    luas_bumi_bapenda: bapendaLandArea,
    luas_bangunan_bapenda: bapendaBuildingArea,
    luas_bumi_pemetaan: mappedLandArea,
    luas_bangunan_pemetaan: mappedBuildingArea,
    njop_bumi_pemetaan: landValue * mappedLandArea,
    njop_bangunan_pemetaan: buildingValue * mappedBuildingArea,
    pbb_pemetaan:
      (landValue * mappedLandArea + buildingValue * mappedBuildingArea) * 0.001,
    volume_bangunan: mappedBuildingArea * (4.2 + index * 0.3),
    tinggi_bangunan: 4.2 + index * 0.3,
  };
});

const seed = async () => {
  const transaction = await sequelize.transaction();
  try {
    const admin = await User.findOne({
      where: { role: "admin" },
      order: [["id_user", "ASC"]],
      transaction,
    });
    if (!admin) {
      throw new Error("Pengguna admin tidak ditemukan untuk created_by");
    }

    let created = 0;
    let updated = 0;
    for (const sample of samples) {
      const existing = await Aset.findOne({
        where: { kode_aset: sample.kode_aset },
        transaction,
      });
      if (existing) {
        await existing.update(
          { ...sample, updated_at: new Date() },
          { transaction },
        );
        updated += 1;
      } else {
        await Aset.create(
          {
            ...sample,
            created_by: admin.id_user,
            created_at: new Date(),
            updated_at: new Date(),
          },
          { transaction },
        );
        created += 1;
      }
    }

    await transaction.commit();
    console.log(
      `Data pajak sampel selesai: ${created} dibuat, ${updated} diperbarui.`,
    );
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    await sequelize.close();
  }
};

seed().catch((error) => {
  console.error("Gagal membuat data pajak sampel:", error.message);
  process.exitCode = 1;
});
