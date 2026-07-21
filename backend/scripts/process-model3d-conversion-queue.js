import sequelize from "../src/config/database.js";
import {
  processNextModel3dConversion,
  resetStaleModel3dConversions,
} from "../src/services/model3dConversion.service.js";

const runOnce = process.argv.includes("--once");
const pollIntervalMs = Math.max(1000, Number(process.env.MODEL3D_WORKER_POLL_MS) || 5000);
const staleMinutes = Math.max(5, Number(process.env.MODEL3D_WORKER_STALE_MINUTES) || 30);
const batchLimit = Math.max(1, Number(process.env.MODEL3D_WORKER_BATCH_LIMIT) || 25);
let stopping = false;

process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });

const wait = (milliseconds) => new Promise((resolve) => {
  setTimeout(resolve, milliseconds);
});

const run = async () => {
  await sequelize.authenticate();
  const recovered = await resetStaleModel3dConversions(staleMinutes);
  if (recovered > 0) {
    console.log(`Mengembalikan ${recovered} pekerjaan 3D yang macet ke antrean`);
  }
  console.log(runOnce
    ? `Memproses maksimal ${batchLimit} pekerjaan konversi 3D`
    : `Worker konversi 3D aktif; polling setiap ${pollIntervalMs} ms`);

  let processedCount = 0;
  while (!stopping) {
    const result = await processNextModel3dConversion();
    if (!result.processed) {
      if (runOnce) break;
      await wait(pollIntervalMs);
      continue;
    }

    processedCount += 1;
    if (result.success) {
      console.log(`Model 3D ${result.modelId} berhasil dikonversi`);
    } else {
      console.error(`Model 3D ${result.modelId} gagal: ${result.error}`);
    }
    if (runOnce && processedCount >= batchLimit) break;
  }
};

try {
  await run();
} catch (error) {
  console.error("Worker konversi 3D berhenti karena error:", error);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
