import bcrypt from "bcryptjs";

const requireSeedPassword = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} wajib diisi sebelum menjalankan seeder`);
  return value;
};

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const hashedPassword = await bcrypt.hash(requireSeedPassword("SEED_ADMIN_PASSWORD"), 10);

  await queryInterface.bulkInsert("users", [
    {
      username: "admin",
      password: hashedPassword,
      email: "admin@bhumisatya.com",
      nama_lengkap: "Administrator",
      role: "admin",
      status_aktif: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      username: "pengelola_aset",
      password: await bcrypt.hash(requireSeedPassword("SEED_PENGELOLA_PASSWORD"), 10),
      email: "pengelola.aset@bhumisatya.com",
      nama_lengkap: "Pengelola Aset",
      role: "pengelola_aset",
      jabatan: "Operator Data Aset",
      instansi: "BPKA",
      status_aktif: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      username: "verifikator_aset",
      password: await bcrypt.hash(requireSeedPassword("SEED_VERIFIKATOR_PASSWORD"), 10),
      email: "verifikator.aset@bhumisatya.com",
      nama_lengkap: "Verifikator Aset",
      role: "verifikator_aset",
      jabatan: "Verifikator Pertanahan",
      instansi: "Badan Pertanahan Nasional",
      status_aktif: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      username: "masyarakat_user",
      password: await bcrypt.hash(requireSeedPassword("SEED_MASYARAKAT_PASSWORD"), 10),
      email: "masyarakat@bhumisatya.com",
      nama_lengkap: "Pengguna Publik",
      role: "masyarakat",
      nik: "1234567890123456",
      no_telepon: "08123456789",
      status_aktif: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("users", null, {});
}
