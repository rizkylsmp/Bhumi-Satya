import { createClient } from "@supabase/supabase-js";

let _supabase;
let _bucketName;

function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      throw new Error(
        "Supabase belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_SERVICE_KEY di .env",
      );
    }
    _supabase = createClient(url, key);
    _bucketName = process.env.SUPABASE_BUCKET || "backups";
  }
  return _supabase;
}

function getBucket() {
  getSupabase();
  return _bucketName;
}

/**
 * Upload a JSON string to Supabase Storage
 */
export async function uploadFile(filename, content) {
  const { error } = await getSupabase()
    .storage.from(getBucket())
    .upload(filename, content, {
      contentType: "application/json",
      upsert: true,
    });
  if (error) throw error;
}

/**
 * Get file content from Supabase Storage as string
 */
export async function getFile(filename) {
  const { data, error } = await getSupabase()
    .storage.from(getBucket())
    .download(filename);
  if (error) throw error;
  return await data.text();
}

/**
 * Get file as a buffer (for download response)
 */
export async function getFileBuffer(filename) {
  const { data, error } = await getSupabase()
    .storage.from(getBucket())
    .download(filename);
  if (error) throw error;
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(filename) {
  const { error } = await getSupabase()
    .storage.from(getBucket())
    .remove([filename]);
  if (error) throw error;
}

/**
 * List all backup files in Supabase Storage
 */
export async function listFiles() {
  const { data, error } = await getSupabase()
    .storage.from(getBucket())
    .list("", {
      sortBy: { column: "created_at", order: "desc" },
    });
  if (error) throw error;
  if (!data) return [];

  return data
    .filter((f) => f.name.endsWith(".json"))
    .map((f) => ({
      filename: f.name,
      size: f.metadata?.size || 0,
      lastModified: f.created_at,
    }));
}

/**
 * Upload any file (image, pdf, etc.) to Supabase Storage
 * Returns the public URL
 */
export async function uploadToSupabase(filename, buffer, contentType) {
  const { error } = await getSupabase()
    .storage.from(getBucket())
    .upload(filename, buffer, {
      contentType,
      upsert: true,
    });
  if (error) throw error;

  const { data } = getSupabase()
    .storage.from(getBucket())
    .getPublicUrl(filename);

  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage by its path
 */
export async function deleteFromSupabase(filename) {
  const { error } = await getSupabase()
    .storage.from(getBucket())
    .remove([filename]);
  if (error) throw error;
}
