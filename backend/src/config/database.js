import { Sequelize } from "sequelize";
import pg from "pg";
import dotenv from "dotenv";

// Load local .env files only outside managed hosting environments.
// cPanel/Passenger injects env vars from the Node.js App panel, so do not let
// an old uploaded .env.production override the panel configuration.
if (!process.env.VERCEL && process.env.LOAD_DOTENV !== "false") {
  const envFile =
    process.env.NODE_ENV === "production" ? ".env.production" : ".env";
  dotenv.config({ path: envFile, override: false });
}

// Database configuration
const isServerless = !!process.env.VERCEL;
const poolMax = Number(process.env.DB_POOL_MAX || (isServerless ? 1 : 2));
const poolMin = Number(process.env.DB_POOL_MIN || 0);
const poolAcquire = Number(process.env.DB_POOL_ACQUIRE || 45000);
const poolIdle = Number(process.env.DB_POOL_IDLE || (isServerless ? 0 : 10000));

const dbConfig = {
  dialect: "postgres",
  dialectModule: pg,
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  pool: isServerless
    ? {
        max: poolMax,
        min: poolMin,
        acquire: poolAcquire,
        idle: poolIdle,
        evict: 1000,
      }
    : {
        max: poolMax,
        min: poolMin,
        acquire: poolAcquire,
        idle: poolIdle,
      },
};

const shouldUseSsl = String(process.env.DB_SSL || "").toLowerCase() === "true";

// Add SSL only when explicitly requested. Local cPanel PostgreSQL usually does
// not use SSL, even when NODE_ENV=production.
if (shouldUseSsl) {
  dbConfig.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

// Create Sequelize instance
let sequelize;
const dbPort = Number(process.env.DB_PORT || 5432);

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL if available
  sequelize = new Sequelize(process.env.DATABASE_URL, dbConfig);
} else {
  // Use individual environment variables
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: Number.isFinite(dbPort) ? dbPort : 5432,
      ...dbConfig,
    },
  );
}

// Only authenticate eagerly in local dev; on Vercel it happens on first query
if (!process.env.VERCEL) {
  sequelize
    .authenticate()
    .then(() => console.log("✅ Database connected"))
    .catch((err) =>
      console.error("❌ Database connection failed:", err.message),
    );
}

export default sequelize;
