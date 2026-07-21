import { DataTypes } from "sequelize";

const initialResponses = [
  {
    nama: "Febri Ardiyanto",
    sumber: "Umum",
    skor: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    submitted_at: new Date("2026-04-07T19:45:23+07:00"),
  },
  {
    nama: "Agus Andrijono",
    sumber: "BPKA",
    skor: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    submitted_at: new Date("2026-04-10T10:59:51+07:00"),
  },
  {
    nama: "Dani M",
    sumber: "BPKA",
    skor: [5, 4, 5, 5, 5, 5, 5, 4, 5, 4, 5],
    submitted_at: new Date("2026-04-10T11:00:11+07:00"),
  },
  {
    nama: "Mohammad Khisanul Masobih, S.Kom",
    sumber: "BPKA",
    skor: [4, 4, 5, 4, 4, 4, 4, 5, 5, 4, 5],
    submitted_at: new Date("2026-04-10T11:00:45+07:00"),
  },
  {
    nama: "Sumarto",
    sumber: "BPKA",
    skor: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    submitted_at: new Date("2026-04-10T11:00:53+07:00"),
  },
  {
    nama: "Yudy",
    sumber: "BPKA",
    skor: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    submitted_at: new Date("2026-04-10T11:01:10+07:00"),
  },
  {
    nama: "Lutfi",
    sumber: "BPKA",
    skor: [5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 4],
    submitted_at: new Date("2026-04-10T11:04:11+07:00"),
  },
  {
    nama: "Sumarto",
    sumber: "BPKA",
    skor: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    submitted_at: new Date("2026-04-10T11:05:19+07:00"),
  },
  {
    nama: "HARIYANTO",
    sumber: "BPKA",
    skor: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    submitted_at: new Date("2026-04-10T11:05:42+07:00"),
  },
  {
    nama: "DWI ANDI OKTAVIANUS",
    sumber: "BPKA",
    skor: [5, 5, 5, 4, 4, 4, 5, 4, 5, 5, 4],
    submitted_at: new Date("2026-04-10T11:07:58+07:00"),
  },
];

export async function up(queryInterface) {
  await queryInterface.createTable("ekasmat_responses", {
    id_ekasmat: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nama: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    sumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Umum",
    },
    skor: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  const now = new Date();
  await queryInterface.bulkInsert(
    "ekasmat_responses",
    initialResponses.map((response) => ({
      ...response,
      created_at: response.submitted_at || now,
      updated_at: now,
    })),
  );
}

export async function down(queryInterface) {
  await queryInterface.dropTable("ekasmat_responses");
}
