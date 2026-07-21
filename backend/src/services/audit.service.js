import { Riwayat } from "../models/index.js";
import { getClientIp } from "../utils/requestIp.js";
import { getChangedFields } from "../utils/auditDiff.js";

/**
 * Service untuk mencatat aktivitas/audit log
 */
class AuditService {
  /**
   * Catat aktivitas ke database
   * @param {Object} params - Parameter logging
   * @param {string} params.aksi - Jenis aksi (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
   * @param {string} params.tabel - Nama tabel yang dimodifikasi
   * @param {number} params.id_referensi - ID record yang dimodifikasi
   * @param {Object} params.data_lama - Data sebelum perubahan
   * @param {Object} params.data_baru - Data setelah perubahan
   * @param {string[]} params.changed_fields - Daftar field yang berubah
   * @param {string} params.instansi_pelaku - Instansi user ketika aksi terjadi
   * @param {string} params.keterangan - Keterangan tambahan
   * @param {number} params.user_id - ID user yang melakukan aksi
   * @param {Object} params.req - Express request object (untuk IP & user agent)
   */
  static async log({
    aksi,
    tabel,
    id_referensi = null,
    data_lama = null,
    data_baru = null,
    changed_fields = null,
    instansi_pelaku = null,
    keterangan = null,
    user_id,
    req = null,
  }) {
    try {
      const ip_address = getClientIp(req);
      const user_agent = req ? req.headers["user-agent"] || null : null;
      const actorInstansi = instansi_pelaku || req?.user?.instansi || null;

      await Riwayat.create({
        aksi,
        tabel,
        id_referensi,
        data_lama,
        data_baru,
        changed_fields,
        instansi_pelaku: actorInstansi,
        keterangan,
        user_id,
        ip_address,
        user_agent,
        created_at: new Date(),
      });
    } catch (error) {
      // Log error but don't throw - audit logging shouldn't break main operations
      console.error("Audit logging error:", error.message);
    }
  }

  /**
   * Log CREATE action
   */
  static async logCreate({
    tabel,
    id_referensi,
    data_baru,
    keterangan,
    user_id,
    req,
  }) {
    await this.log({
      aksi: "CREATE",
      tabel,
      id_referensi,
      data_baru,
      keterangan,
      user_id,
      req,
    });
  }

  /**
   * Log UPDATE action
   */
  static async logUpdate({
    tabel,
    id_referensi,
    data_lama,
    data_baru,
    keterangan,
    user_id,
    req,
  }) {
    await this.log({
      aksi: "UPDATE",
      tabel,
      id_referensi,
      data_lama,
      data_baru,
      changed_fields: getChangedFields(data_lama, data_baru),
      keterangan,
      user_id,
      req,
    });
  }

  /**
   * Log DELETE action
   */
  static async logDelete({
    tabel,
    id_referensi,
    data_lama,
    keterangan,
    user_id,
    req,
  }) {
    await this.log({
      aksi: "DELETE",
      tabel,
      id_referensi,
      data_lama,
      keterangan,
      user_id,
      req,
    });
  }

  /**
   * Log LOGIN action
   */
  static async logLogin({ user_id, keterangan, req }) {
    await this.log({
      aksi: "LOGIN",
      tabel: "users",
      id_referensi: user_id,
      keterangan: keterangan || "User login",
      user_id,
      req,
    });
  }

  /**
   * Log LOGOUT action
   */
  static async logLogout({ user_id, keterangan, req }) {
    await this.log({
      aksi: "LOGOUT",
      tabel: "users",
      id_referensi: user_id,
      keterangan: keterangan || "User logout",
      user_id,
      req,
    });
  }
}

export default AuditService;
