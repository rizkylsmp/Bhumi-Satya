import { EkasmatResponse } from "../models/index.js";
import AuditService from "../services/audit.service.js";

export const getAll = async (req, res) => {
  try {
    const data = await EkasmatResponse.findAll({
      order: [["submitted_at", "ASC"]],
    });

    res.json({
      success: true,
      data: data.map((item) => ({
        id: item.id_ekasmat,
        timestamp: item.submitted_at,
        name: item.nama,
        source: item.sumber,
        scores: item.skor,
      })),
    });
  } catch (error) {
    console.error("EKASMAT getAll error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const submit = async (req, res) => {
  try {
    const { name, source = "Umum", scores } = req.body;

    console.log("EKASMAT submit request:", { name, source, scores });

    if (!name?.trim()) {
      return res.status(400).json({ error: "Nama wajib diisi" });
    }

    if (
      !Array.isArray(scores) ||
      scores.length !== 11 ||
      scores.some((score) => !Number.isInteger(Number(score)) || score < 1 || score > 5)
    ) {
      console.error("EKASMAT validation failed:", {
        isArray: Array.isArray(scores),
        length: scores?.length,
        scores
      });
      return res.status(400).json({
        error: "Skor kuisioner tidak valid",
      });
    }

    const dataToCreate = {
      nama: name.trim(),
      sumber: source,
      skor: scores.map(Number),
      submitted_at: new Date(),
    };

    console.log("EKASMAT creating with data:", dataToCreate);

    const response = await EkasmatResponse.create(dataToCreate);

    console.log("EKASMAT created successfully:", response.id_ekasmat);

    res.status(201).json({
      success: true,
      data: {
        id: response.id_ekasmat,
        timestamp: response.submitted_at,
        name: response.nama,
        source: response.sumber,
        scores: response.skor,
      },
    });
  } catch (error) {
    console.error("EKASMAT submit error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      original: error.original,
      parent: error.parent,
    });
    res.status(500).json({
      error: error.message,
      details: error.original?.message || error.parent?.message
    });
  }
};

export const updateById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, source, scores } = req.body;

    // Validasi
    if (!name?.trim()) {
      return res.status(400).json({ error: "Nama wajib diisi" });
    }

    if (
      !Array.isArray(scores) ||
      scores.length !== 11 ||
      scores.some(
        (score) =>
          !Number.isInteger(Number(score)) || score < 1 || score > 5,
      )
    ) {
      return res.status(400).json({
        error: "Skor kuisioner tidak valid",
      });
    }

    // Cari data
    const existing = await EkasmatResponse.findByPk(id);
    if (!existing) {
      return res.status(404).json({ error: "Data tidak ditemukan" });
    }

    // Simpan data lama untuk audit
    const oldData = {
      nama: existing.nama,
      sumber: existing.sumber,
      skor: existing.skor,
    };

    // Update
    await existing.update({
      nama: name.trim(),
      sumber: source || "Umum",
      skor: scores.map(Number),
    });

    // Audit trail
    await AuditService.log(
      req.user.id_user,
      "UPDATE",
      "ekasmat_responses",
      existing.id_ekasmat,
      `Mengubah data EKASMAT: ${oldData.nama} → ${existing.nama}`,
    );

    res.json({
      success: true,
      data: {
        id: existing.id_ekasmat,
        timestamp: existing.submitted_at,
        name: existing.nama,
        source: existing.sumber,
        scores: existing.skor,
      },
    });
  } catch (error) {
    console.error("EKASMAT update error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteById = async (req, res) => {
  try {
    const { id } = req.params;

    // Cari data
    const existing = await EkasmatResponse.findByPk(id);
    if (!existing) {
      return res.status(404).json({ error: "Data tidak ditemukan" });
    }

    const deletedName = existing.nama;

    // Hapus
    await existing.destroy();

    // Audit trail
    await AuditService.log(
      req.user.id_user,
      "DELETE",
      "ekasmat_responses",
      id,
      `Menghapus data EKASMAT: ${deletedName}`,
    );

    res.json({
      success: true,
      message: "Data berhasil dihapus",
    });
  } catch (error) {
    console.error("EKASMAT delete error:", error);
    res.status(500).json({ error: error.message });
  }
};
