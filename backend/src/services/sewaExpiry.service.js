import { Op } from "sequelize";
import { SewaAset } from "../models/index.js";

/**
 * Auto-expire sewa records where tanggal_berakhir < today.
 * Called before every GET so expired records are always up-to-date.
 * Returns the count of expired records that were processed.
 */
export const autoExpireSewa = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all sewa with active status where tanggal_berakhir < today
    const expiredSewa = await SewaAset.findAll({
      where: {
        status: { [Op.in]: ["Disewakan", "Akan Berakhir"] },
        tanggal_berakhir: { [Op.lt]: today },
      },
      attributes: ["id_sewa", "id_aset", "nama_aset", "tanggal_berakhir"],
    });

    if (expiredSewa.length === 0) return { expired: 0 };

    // Bulk update all expired sewa to "Berakhir"
    const ids = expiredSewa.map((s) => s.id_sewa);
    const [, updatedRows] = await SewaAset.update(
      { status: "Berakhir" },
      { where: { id_sewa: ids } }
    );

    console.log(`[sewaExpiry] ${updatedRows} sewa auto-expired to "Berakhir"`);

    // For each expired sewa without another active record on the same asset,
    // create a new "Tersedia" record so the asset appears available again.
    const asetIds = expiredSewa.map((s) => s.id_aset).filter(Boolean);
    if (asetIds.length > 0) {
      const stillActive = await SewaAset.findAll({
        where: {
          id_aset: asetIds,
          status: { [Op.in]: ["Diproses", "Disewakan", "Akan Berakhir"] },
        },
        attributes: ["id_aset"],
        raw: true,
      });

      const blockedAsetIds = new Set(stillActive.map((s) => s.id_aset));
      const availableAsetIds = asetIds.filter((id) => !blockedAsetIds.has(id));

      for (const asetId of availableAsetIds) {
        const oldSewa = expiredSewa.find((s) => s.id_aset === asetId);
        if (!oldSewa) continue;

        // Check if a "Tersedia" record already exists for this asset
        const existing = await SewaAset.findOne({
          where: { id_aset: asetId, status: "Tersedia" },
          attributes: ["id_sewa"],
        });

        if (!existing) {
          await SewaAset.create({
            id_aset: asetId,
            nama_aset: oldSewa.nama_aset,
            status: "Tersedia",
          });
          console.log(
            `[sewaExpiry] Aset ${asetId} ("${oldSewa.nama_aset}") marked available`
          );
        }
      }
    }

    return { expired: updatedRows || 0 };
  } catch (error) {
    console.error("Auto-expire sewa error:", error);
    return { expired: 0, error: error.message };
  }
};
