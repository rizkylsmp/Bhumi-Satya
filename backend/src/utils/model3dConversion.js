import { createRequire } from "node:module";
import { unzipSync } from "fflate";

const require = createRequire(import.meta.url);
const assimpFactory = require("assimpjs");
let assimpPromise;

const getAssimp = () => {
  if (!assimpPromise) assimpPromise = assimpFactory();
  return assimpPromise;
};

const normalizePath = (value = "") => String(value)
  .replaceAll("\\", "/")
  .replace(/^\.\//, "")
  .replace(/^\//, "");

export class Model3dConversionError extends Error {
  constructor(message) {
    super(message);
    this.name = "Model3dConversionError";
  }
}

export const convertKmzToGlb = async (kmzBuffer, modelEntry) => {
  let entries;
  try {
    entries = unzipSync(new Uint8Array(kmzBuffer));
  } catch {
    throw new Model3dConversionError("KMZ sumber tidak dapat diekstrak");
  }

  const normalizedModelEntry = normalizePath(modelEntry);
  const rawModelKey = Object.keys(entries).find(
    (key) => normalizePath(key) === normalizedModelEntry,
  );
  if (!rawModelKey) {
    throw new Model3dConversionError("File model utama tidak ditemukan di dalam KMZ");
  }

  const assimp = await getAssimp();
  const fileList = new assimp.FileList();
  fileList.AddFile(normalizedModelEntry, entries[rawModelKey]);
  Object.entries(entries).forEach(([name, content]) => {
    const normalizedName = normalizePath(name);
    if (name === rawModelKey || normalizedName.toLowerCase().endsWith(".kml")) return;
    fileList.AddFile(normalizedName, content);
  });

  const result = assimp.ConvertFileList(fileList, "glb2");
  if (!result.IsSuccess() || result.FileCount() === 0) {
    throw new Model3dConversionError(
      `Konversi Assimp gagal dengan kode ${result.GetErrorCode()}`,
    );
  }

  let output = null;
  for (let index = 0; index < result.FileCount(); index += 1) {
    const candidate = result.GetFile(index);
    if (!output || candidate.GetPath()?.toLowerCase().endsWith(".glb")) {
      output = candidate;
    }
  }
  if (!output) throw new Model3dConversionError("Konverter tidak menghasilkan file GLB");

  const content = output.GetContent();
  const glb = Buffer.from(content.buffer, content.byteOffset, content.byteLength);
  if (glb.length < 12 || glb.toString("ascii", 0, 4) !== "glTF") {
    throw new Model3dConversionError("Hasil konversi bukan binary glTF yang valid");
  }
  return {
    buffer: glb,
    filename: output.GetPath() || "model.glb",
  };
};

