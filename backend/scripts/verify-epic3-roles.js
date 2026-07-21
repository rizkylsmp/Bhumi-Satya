import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

dotenv.config({
  path: path.join(
    backendRoot,
    process.env.NODE_ENV === "production" ? ".env.production" : ".env",
  ),
  override: false,
});

const sslEnabled = String(process.env.DB_SSL || "").toLowerCase() === "true";
const connectionConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

if (sslEnabled) {
  connectionConfig.ssl = { rejectUnauthorized: false };
}

const client = new Client(connectionConfig);

const targetRoles = new Set([
  "admin",
  "pengelola_aset",
  "verifikator_aset",
  "viewer",
  "masyarakat",
]);

const legacyRoles = new Set(["admin_bpka", "admin_bpn", "bpka", "bpn"]);

try {
  await client.connect();

  const roleDistribution = (
    await client.query(`
      SELECT role::text AS role, COUNT(*)::int AS count
      FROM users
      GROUP BY role
      ORDER BY role
    `)
  ).rows;

  const invalidRoles = roleDistribution
    .map((row) => row.role)
    .filter((role) => !targetRoles.has(role));

  const activeLegacyRoles = roleDistribution
    .map((row) => row.role)
    .filter((role) => legacyRoles.has(role));

  const constraint = (
    await client.query(`
      SELECT conname, pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conname = 'users_role_target_check'
        AND conrelid = 'users'::regclass
    `)
  ).rows;

  const columnDefault = (
    await client.query(`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'role'
    `)
  ).rows[0]?.column_default;

  if (invalidRoles.length > 0) {
    throw new Error(`Invalid active roles: ${invalidRoles.join(", ")}`);
  }

  if (activeLegacyRoles.length > 0) {
    throw new Error(`Legacy active roles remain: ${activeLegacyRoles.join(", ")}`);
  }

  if (constraint.length !== 1) {
    throw new Error("users_role_target_check constraint is missing");
  }

  if (!String(columnDefault || "").includes("viewer")) {
    throw new Error(`Unexpected users.role default: ${columnDefault}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        roleDistribution,
        constraint: constraint[0],
        columnDefault,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
